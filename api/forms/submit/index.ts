import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Connection, Request } from "tedious";
import { config } from '../shared/config';
import { Context, HttpRequest } from "@azure/functions";            // Keep for types
// Remove AzureFunction import

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    // Add CORS headers
    context.res = {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": process.env.CORS_ALLOWED_ORIGINS?.split(',') || "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        context.res.status = 204;
        return;
    }

    try {
        const { formData, userId, formType, submittedAt } = req.body;

        if (!formData || !userId || !formType || !submittedAt) {
            context.res = {
                ...context.res,
                status: 400,
                body: { message: "Missing required fields" }
            };
            return;
        }

        const connection = new Connection(config);

        await new Promise((resolve, reject) => {
            connection.on('connect', (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                const request = new Request(
                    `INSERT INTO FormSubmissions (UserId, FormType, FormData, SubmittedAt)
                     VALUES (@userId, @formType, @formData, @submittedAt)`,
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(true);
                    }
                );

                request.addParameter('userId', 'NVarChar', userId);
                request.addParameter('formType', 'NVarChar', formType);
                request.addParameter('formData', 'NVarChar', JSON.stringify(formData));
                request.addParameter('submittedAt', 'DateTime2', new Date(submittedAt));

                connection.execSql(request);
            });

            connection.connect();
        });

        context.res = {
            ...context.res,
            status: 200,
            body: { message: "Form submitted successfully" }
        };

    } catch (error) {
        context.log.error('Error submitting form:', error);
        context.res = {
            ...context.res,
            status: 500,
            body: { message: "Internal server error", error: error.message }
        };
    }
};

export default httpTrigger;
