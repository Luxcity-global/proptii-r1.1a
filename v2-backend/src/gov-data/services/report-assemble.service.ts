import { Injectable, Logger } from '@nestjs/common';
import { FactsStoreService } from './facts-store.service';
import { PostcodesIoService, PostcodeResult } from './postcodes-io.service';
import { EaFloodService } from './ea-flood.service';
import { EpcIngestService } from './epc-ingest.service';
import { LocalAreaService } from './local-area.service';
import { ReportRequestDto } from '../../controllers/report.controller';
import { Flag } from '../schemas/flag.schema';

@Injectable()
export class ReportAssembleService {
  private readonly logger = new Logger(ReportAssembleService.name);

  constructor(
    private readonly factsStore: FactsStoreService,
    private readonly postcodesIo: PostcodesIoService,
    private readonly eaFlood: EaFloodService,
    private readonly epcIngest: EpcIngestService,
    private readonly localArea: LocalAreaService,
  ) {}

  // 1. Check if we already have it in Firestore
  // const existingFacts = await this.factsStore.getByListingId(listingId);

  async streamReport(dto: ReportRequestDto, res: any): Promise<void> {
    const { listingId, address } = dto;
    const postcode = address.postcode!;

    // 1. Resolve Centroid (via postcodes.io or directly from input coordinates)
    let centroid: PostcodeResult | null = null;
    if (address.coordinates && address.coordinates.lat && address.coordinates.lng) {
      centroid = {
        latitude: address.coordinates.lat,
        longitude: address.coordinates.lng,
        admin_district: address.display?.split(',')[1]?.trim() || '',
        lsoa: ''
      };
    } else {
      const centroidResult = await this.withTimeout(this.postcodesIo.getCentroid(postcode), 3500);
      centroid = centroidResult.status === 'fulfilled' ? centroidResult.value : null;
    }

    // Build base report skeleton
    const reportData = {
      generatedAt: new Date().toISOString(),
      audience: 'tenant',
      match: {
        status: centroid ? 'postcode' : 'none',
        precision: 'postcode',
        uprn: null,
        lat: centroid?.latitude || 0,
        lng: centroid?.longitude || 0,
      },
      sources: [
        { id: 'postcodes', label: 'Postcode location', state: centroid ? 'clear' : 'unresolved' },
        { id: 'epc', label: 'EPC register', state: 'loading' },
        { id: 'flood', label: 'EA flood risk', state: 'loading' },
        { id: 'crime', label: 'police.uk', state: 'loading' },
        { id: 'heritage', label: 'Listed / conservation', state: 'loading' }
      ],
      partA: { listingPrice: "from listing" },
      partB: { epcBand: null, floorAreaM2: 0, lodged: '', winterNote: '' },
      partC: { status: 'pending_nps', message: 'To come in next release' },
      local: {
        flood: { headline: 'Loading...', groundwater: 'Loading...', caveat: 'loading' },
        crime: { month: 'Loading...', count: 0, topCategories: [] },
        heritage: { listed: false, grade: null, conservationArea: false, name: null, caveat: 'loading' }
      },
      map: { embedQuery: encodeURIComponent(address.display) },
      steps: []
    };

    // Send initial skeleton
    res.write(JSON.stringify({ type: 'initial', data: reportData }) + '\n');

    const trackAndStream = async (moduleName: string, promise: Promise<any>, formatter: (val: any) => any, timeoutMs: number = 3500) => {
      const result = await this.withTimeout(promise, timeoutMs);
      const val = result.status === 'fulfilled' ? result.value : null;
      res.write(JSON.stringify({ type: 'chunk', module: moduleName, data: formatter(val) }) + '\n');
      return val;
    };

    // Launch parallel fetches (Fast ones get 3.5s, Police gets up to 20s since it streams in background)
    const epcPromise = trackAndStream('epc', this.epcIngest.getEpcJit(postcode, address.display), val => val || null, 3500);
    const floodPromise = trackAndStream('flood', this.eaFlood.getFloodRisk(postcode), val => val || { headline: 'Unknown', groundwater: 'Unknown', caveat: 'unresolved' }, 3500);
    
    let crimePromise = Promise.resolve(null);
    let heritagePromise = Promise.resolve(null);

    if (centroid) {
      crimePromise = trackAndStream('crime', this.localArea.getCrime(centroid), val => val || null, 20000);
      heritagePromise = trackAndStream('heritage', this.localArea.getHeritage(centroid), val => val || { listed: false, grade: null, conservationArea: false, name: null, caveat: 'unresolved' }, 3500);
    } else {
      res.write(JSON.stringify({ type: 'chunk', module: 'crime', data: null }) + '\n');
      res.write(JSON.stringify({ type: 'chunk', module: 'heritage', data: { listed: false, grade: null, conservationArea: false, name: null, caveat: 'unresolved' } }) + '\n');
    }

    // Wait for all to finish so we can save to Firestore
    const [epc, flood, crime, heritage] = await Promise.all([epcPromise, floodPromise, crimePromise, heritagePromise]);
    
    await this.saveToFirestore(listingId, { centroid, epc, flood, crime, heritage });
    res.end();
  }
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<{ status: 'fulfilled', value: T } | { status: 'rejected', reason: any }> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ status: 'rejected', reason: new Error(`Timeout after ${ms}ms`) });
      }, ms);

      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve({ status: 'fulfilled', value });
        },
        (reason) => {
          clearTimeout(timer);
          resolve({ status: 'rejected', reason });
        }
      );
    });
  }

  private async saveToFirestore(listingId: string, data: any) {
    try {
      const flags: Flag[] = [];
      const timestamp = new Date().toISOString();

      if (data.epc) {
        flags.push({
          flagId: 'epc_rating',
          source: 'epc_register',
          cadence: 'live',
          state: data.epc.epcBand.match(/^[A-C]$/) ? 'clear' : 'flagged',
          baseSeverity: data.epc.epcBand.match(/^[A-C]$/) ? 'info' : 'medium',
          detail: `EPC rating ${data.epc.epcBand}`,
          ingestedAt: timestamp,
          sourceRef: null
        });
      }

      // Minimal write to satisfy the PRD's requirement that facts are stored.
      await this.factsStore.upsert(listingId, {
        listing_id: listingId,
        matchStatus: data.centroid ? 'partial' : 'none',
        flags
      });
    } catch (err: any) {
      this.logger.error(`Failed to save facts to Firestore for ${listingId}: ${err.message}`);
    }
  }
}
