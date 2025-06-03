export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: 'File size must be less than 5MB'
        };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Only JPEG, PNG and PDF files are allowed'
        };
    }

    return { isValid: true };
};

export const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;
                const maxDimension = 1200;

                if (width > height && width > maxDimension) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Could not compress image'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    0.7 // compression quality
                );
            };
            img.onerror = () => {
                reject(new Error('Error loading image'));
            };
        };
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
    });
};

export const processFile = async (file: File): Promise<{ file: File; error?: string }> => {
    try {
        const validation = validateFile(file);
        if (!validation.isValid) {
            return { file, error: validation.error };
        }

        const processedFile = await compressImage(file);
        return { file: processedFile };
    } catch (err) {
        return {
            file,
            error: 'Error processing file. Please try again.'
        };
    }
}; 