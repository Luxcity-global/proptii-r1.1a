import { SavedProperty } from '../../mocks/dashboardApi';

// Service to manage saved properties from external collections
class SavedPropertiesService {
  private static instance: SavedPropertiesService;
  private savedProperties: SavedProperty[] = [];

  private constructor() {
    // Load saved properties from localStorage on initialization
    this.loadSavedProperties();
  }

  public static getInstance(): SavedPropertiesService {
    if (!SavedPropertiesService.instance) {
      SavedPropertiesService.instance = new SavedPropertiesService();
    }
    return SavedPropertiesService.instance;
  }

  private loadSavedProperties(): void {
    try {
      const saved = localStorage.getItem('externalCollections_savedProperties');
      if (saved) {
        this.savedProperties = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved properties:', error);
      this.savedProperties = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('externalCollections_savedProperties', JSON.stringify(this.savedProperties));
    } catch (error) {
      console.error('Error saving properties to storage:', error);
    }
  }

  public isPropertySaved(propertyId: string): boolean {
    return this.savedProperties.some(prop => prop.id === propertyId);
  }

  public saveProperty(property: {
    id: string;
    title: string;
    price: number;
    location: { address: string; city: string; postcode: string };
    bedrooms: number;
    bathrooms: number;
    type: string;
    source: string;
    images: Array<{ src: string; alt: string }>;
  }): void {
    if (this.isPropertySaved(property.id)) {
      return; // Already saved
    }

    const savedProperty: SavedProperty = {
      id: property.id,
      price: property.price,
      address: property.location.address,
      city: property.location.city,
      postcode: property.location.postcode,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      propertyType: property.type === 'rent' ? 'Rental' : 'Sale',
      imageUrl: property.images[0]?.src || '/images/listings/property-main.jpg',
      savedAt: new Date().toISOString()
    };

    this.savedProperties.push(savedProperty);
    this.saveToStorage();
  }

  public removeProperty(propertyId: string): void {
    this.savedProperties = this.savedProperties.filter(prop => prop.id !== propertyId);
    this.saveToStorage();
  }

  public getSavedProperties(): SavedProperty[] {
    return [...this.savedProperties];
  }

  public getSavedPropertiesCount(): number {
    return this.savedProperties.length;
  }
}

export const savedPropertiesService = SavedPropertiesService.getInstance(); 