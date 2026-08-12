import { Body, Controller, Logger, Post, Get, Put, Delete, Param, Query, UseInterceptors, UploadedFile, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ContractEmailService } from '../services/contract-email.service';

interface SendSignedContractDto {
  to: string;
  subject: string;
  recipientName: string;
  contractName: string;
  senderName: string;
  senderEmail: string;
  emailType: string;
  htmlContent: string;
}

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractEmailService: ContractEmailService) {}
  private readonly logger = new Logger(ContractController.name);

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getContracts(@Req() req: any) {
    try {
      const tenantEmail = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username;
      if (!tenantEmail) {
        return { success: false, error: 'User email not found' };
      }
      
      const admin = await import('firebase-admin');
      if (!admin.apps.length) {
        const { initializeFirestore } = await import('../config/firestore.config');
        await initializeFirestore();
      }
      
      const db = admin.firestore();
      const snapshot = await db.collection('contracts')
        .where('tenantEmail', '==', tenantEmail.toLowerCase().trim())
        .get();
        
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          sentDate: docData.sentDate?.toDate?.() || docData.sentDate,
          signedDate: docData.signedDate?.toDate?.() || docData.signedDate,
          expiryDate: docData.expiryDate?.toDate?.() || docData.expiryDate,
        };
      });
      
      data.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime());
      
      return { success: true, data };
    } catch (error: any) {
      this.logger.error('❌ Error getting contracts:', error);
      return { success: false, error: error.message };
    }
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async saveContractTemplate(@Req() req: any, @Body() body: any) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) return { success: false, error: 'User ID not found' };
      
      const admin = await import('firebase-admin');
      const db = admin.firestore();
      
      const templateId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = db.collection('contractTemplates').doc(templateId);
      
      const contractData = {
        id: templateId,
        userId,
        ...body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await docRef.set(contractData);
      return { success: true, templateId };
    } catch (error: any) {
      this.logger.error('❌ Error saving contract template:', error);
      return { success: false, error: error.message };
    }
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getContractTemplates(@Req() req: any, @Query('status') status: string = 'active') {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) return { success: false, error: 'User ID not found' };
      
      const admin = await import('firebase-admin');
      const db = admin.firestore();
      
      const snapshot = await db.collection('contractTemplates')
        .where('userId', '==', userId)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();
        
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          ...docData,
          createdAt: docData.createdAt?.toDate?.() || docData.createdAt,
          updatedAt: docData.updatedAt?.toDate?.() || docData.updatedAt,
        };
      });
      return { success: true, templates: data };
    } catch (error: any) {
      this.logger.error('❌ Error getting contract templates:', error);
      return { success: false, error: error.message };
    }
  }

  @Put('templates/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateContractTemplateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    try {
      const admin = await import('firebase-admin');
      const db = admin.firestore();
      await db.collection('contractTemplates').doc(id).update({
        status: body.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @Delete('templates/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async permanentlyDeleteContractTemplate(@Req() req: any, @Param('id') id: string) {
    try {
      const admin = await import('firebase-admin');
      const db = admin.firestore();
      await db.collection('contractTemplates').doc(id).delete();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @Get('stats/templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getContractStats(@Req() req: any) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) return { success: false, error: 'User ID not found' };
      
      const admin = await import('firebase-admin');
      const db = admin.firestore();
      const snapshot = await db.collection('contractTemplates')
        .where('userId', '==', userId)
        .get();
        
      const stats = { total: 0, active: 0, deleted: 0, totalSize: 0 };
      snapshot.forEach(doc => {
        const template = doc.data();
        stats.total++;
        stats.totalSize += template.fileSize || 0;
        if (template.status === 'active') stats.active++;
        else if (template.status === 'deleted') stats.deleted++;
      });
      
      return { success: true, stats };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  @Post('send-signed-contract')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('attachment'))
  async sendSignedContract(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SendSignedContractDto
  ) {
    try {
      this.logger.log('📧 Received contract email request:', {
        to: body.to,
        contractName: body.contractName,
        recipientName: body.recipientName,
        fileSize: file?.size || 0
      });

      if (!file) {
        throw new Error('No contract file provided');
      }

      const result = await this.contractEmailService.sendSignedContractEmail({
        to: body.to,
        subject: body.subject,
        recipientName: body.recipientName,
        contractName: body.contractName,
        senderName: body.senderName,
        senderEmail: body.senderEmail,
        htmlContent: body.htmlContent,
        attachment: {
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype
        }
      });

      return result;

    } catch (error) {
      this.logger.error('❌ Error in contract controller:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
