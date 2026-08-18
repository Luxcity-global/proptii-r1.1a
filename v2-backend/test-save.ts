import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ReferencingService } from './src/services/referencing.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const referencingService = app.get(ReferencingService);

  try {
    console.log("Saving form data...");
    await referencingService.saveFormData('general_test-001', {
      formData: { identity: { identityProof: { name: "test.jpg", url: "https://test" } } },
      currentStep: 1,
      stepStatus: {}
    });
    console.log("Saved successfully!");
  } catch (err) {
    console.error("Save error:", err);
  }
  
  await app.close();
}
bootstrap();
