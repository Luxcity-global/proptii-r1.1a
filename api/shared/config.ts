export const config = {
    server: 'proptiir11.database.windows.net',  // Update to your actual server
    authentication: {
        type: 'default',
        options: {
            userName: 'Proptii-lead-ninja',     // Update to match your .env
            password: 'G3t1nL04$'               // Update to match your .env
        }
    },
    options: {
        database: 'proptii-r1-1',              // Update to match your .env
        encrypt: true,
        trustServerCertificate: false,
        enableArithAbort: true
    }
};
