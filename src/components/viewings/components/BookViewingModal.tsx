const isAllDataComplete = () => {
    const property = state.selectedProperty;
    const viewing = state.viewingDetails;

    return property?.street &&
        property?.city &&
        property?.agent?.name &&
        property?.agent?.email &&
        viewing?.date &&
        viewing?.time &&
        viewing?.preference;
}; 