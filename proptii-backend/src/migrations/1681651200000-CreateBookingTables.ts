import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookingTables1681651200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE Properties (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                street NVARCHAR(255) NOT NULL,
                city NVARCHAR(100) NOT NULL,
                town NVARCHAR(100),
                postcode NVARCHAR(10) NOT NULL,
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE()
            );

            CREATE TABLE Agents (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                name NVARCHAR(255) NOT NULL,
                email NVARCHAR(255) NOT NULL,
                phone NVARCHAR(20),
                company NVARCHAR(255) NOT NULL,
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE()
            );

            CREATE TABLE ViewingRequests (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                property_id UNIQUEIDENTIFIER NOT NULL,
                agent_id UNIQUEIDENTIFIER NOT NULL,
                viewing_date DATE NOT NULL,
                viewing_time TIME NOT NULL,
                preference NVARCHAR(50) NOT NULL,
                status NVARCHAR(20) DEFAULT 'PENDING',
                created_at DATETIME2 DEFAULT GETDATE(),
                updated_at DATETIME2 DEFAULT GETDATE(),
                FOREIGN KEY (property_id) REFERENCES Properties(id),
                FOREIGN KEY (agent_id) REFERENCES Agents(id)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS ViewingRequests;
            DROP TABLE IF EXISTS Agents;
            DROP TABLE IF EXISTS Properties;
        `);
    }
} 