private async saveFormSection(userId: string, section: string, data: any) {
  try {
    if (!userId || !section || !data) {
      throw new Error('Missing required parameters');
    }

    // Generate a unique ID for the document
    const documentId = `${section}_${userId}_${Date.now()}`;

    // Prepare the document
    const document = {
      id: documentId,
      userId,
      type: section,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create new document
    const { resource } = await this.container.items.create(document);

    console.log(`Saved ${section} data:`, {
      id: resource.id,
      userId,
      type: section
    });

    return {
      success: true,
      message: `${section} data saved successfully`,
      data: resource
    };
  } catch (error) {
    console.error(`Error saving ${section} data:`, error);
    throw new Error(`Error saving ${section} data: ${error.message}`);
  }
} 