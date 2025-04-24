CREATE TABLE FormSubmissions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId NVARCHAR(255) NOT NULL,
    FormType NVARCHAR(50) NOT NULL,
    FormData NVARCHAR(MAX) NOT NULL,
    SubmittedAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Add index for better query performance
CREATE INDEX IX_FormSubmissions_UserId ON FormSubmissions(UserId);
CREATE INDEX IX_FormSubmissions_FormType ON FormSubmissions(FormType);
