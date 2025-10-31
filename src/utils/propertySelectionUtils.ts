import { propertySelectionService } from '../services/propertySelectionService';

export interface PropertyData {
  id: string;
  title: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  description: string;
  images: string[];
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
  };
  location: {
    street: string;
    town: string;
    city: string;
    postcode: string;
  };
}

/**
 * Save a property selection when user clicks on a listing
 */
export const savePropertySelection = async (
  userId: string,
  propertyData: PropertyData,
  source: 'search_results' | 'direct_booking' | 'agent_recommendation' = 'search_results'
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Saving property selection:', { userId, propertyData, source });
    
    const result = await propertySelectionService.savePropertySelection(
      userId,
      {
        title: propertyData.title,
        address: propertyData.address,
        price: propertyData.price,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        propertyType: propertyData.propertyType,
        description: propertyData.description,
        images: propertyData.images,
        agent: propertyData.agent,
        location: propertyData.location
      },
      propertyData.id,
      source
    );

    if (result.success) {
      console.log('✅ Property selection saved successfully');
    } else {
      console.error('❌ Failed to save property selection:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error in savePropertySelection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Remove a property selection
 */
export const removePropertySelection = async (
  selectionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Removing property selection:', selectionId);
    
    const result = await propertySelectionService.deletePropertySelection(selectionId);

    if (result.success) {
      console.log('✅ Property selection removed successfully');
    } else {
      console.error('❌ Failed to remove property selection:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error in removePropertySelection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Update property selection status
 */
export const updatePropertySelectionStatus = async (
  selectionId: string,
  status: 'interested' | 'viewing_requested' | 'viewing_scheduled' | 'viewing_completed' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Updating property selection status:', { selectionId, status, notes });
    
    const result = await propertySelectionService.updatePropertySelectionStatus(
      selectionId,
      status,
      notes
    );

    if (result.success) {
      console.log('✅ Property selection status updated successfully');
    } else {
      console.error('❌ Failed to update property selection status:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error in updatePropertySelectionStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
