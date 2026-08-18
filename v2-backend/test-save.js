"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const referencing_service_1 = require("./src/services/referencing.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const referencingService = app.get(referencing_service_1.ReferencingService);
    try {
        console.log("Saving form data...");
        await referencingService.saveFormData('general_test-001', {
            formData: { identity: { identityProof: { name: "test.jpg", url: "https://test" } } },
            currentStep: 1,
            stepStatus: {}
        });
        console.log("Saved successfully!");
    }
    catch (err) {
        console.error("Save error:", err);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-save.js.map