/**
 * gov-data.module.ts
 *
 * Government Data Intelligence Layer — NestJS module boundary.
 *
 * Declares all ingest services, the facts store, and the compliance
 * transform hook. Registered in AppModule (app.module.ts).
 *
 * ScheduleModule is imported here (not at AppModule level) to keep the
 * cron jobs scoped to this module's concern.
 *
 * Exports:
 *   - FactsStoreService    — used by property-facts.controller.ts
 *   - ComplianceTransformService — injected into ReferencingService
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { FactsStoreService }          from './services/facts-store.service';
import { UprnMatchService }            from './services/uprn-match.service';
import { HmlrIngestService }           from './services/hmlr-ingest.service';
import { OsNgdIngestService }          from './services/os-ngd-ingest.service';
import { EpcIngestService }            from './services/epc-ingest.service';
import { IngestMetaService }           from './services/ingest-meta.service';
import { ComplianceTransformService }  from './services/compliance-transform.service';
import { LensEngineService }           from './services/lens-engine.service';
import { PostcodesIoService }          from './services/postcodes-io.service';
import { EaFloodService }              from './services/ea-flood.service';
import { LocalAreaService }            from './services/local-area.service';
import { ReportAssembleService }       from './services/report-assemble.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [
    // Core store — all reads/writes to propertyFacts
    FactsStoreService,

    // UPRN address matching
    UprnMatchService,

    // Ingest metadata tracker (shared by all ingest jobs)
    IngestMetaService,

    // Ingest cron jobs (registered with @nestjs/schedule)
    HmlrIngestService,    // STUBBED — no licensed data yet
    OsNgdIngestService,   // pagination implemented — needs OS_NGD_API_KEY
    EpcIngestService,     // DISABLED — pending scope confirmation

    // Compliance transform — hooked into ReferencingService.saveUserFile()
    ComplianceTransformService,

    // Lens engine — Sprint 1.2. Loads lensRules from Firestore at module init.
    LensEngineService,

    // JIT Services (24h Renter Report Fan-out)
    PostcodesIoService,
    EaFloodService,
    LocalAreaService,
    ReportAssembleService,
  ],
  exports: [
    FactsStoreService,
    ComplianceTransformService,
    UprnMatchService,
    IngestMetaService,
    LensEngineService,
    ReportAssembleService,
  ],
})
export class GovDataModule {}
