import { Request, Response, NextFunction, RequestHandler } from 'express';
import { EmailService } from '../../infrastructure/EmailService';

const emailService = new EmailService();

export const bookViewing: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      agentEmail, 
      userName, 
      userEmail, 
      propertyName, 
      propertyUrl, 
      preferredDate, 
      message 
    } = req.body;

    if (!agentEmail || !userName || !userEmail || !propertyName || !propertyUrl || !preferredDate) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Missing required booking details' 
      });
    }


    await emailService.sendViewingRequest(agentEmail, {
      userName,
      userEmail,
      propertyName,
      propertyUrl,
      preferredDate,
      message
    });

    res.status(200).json({ 
      status: 'success', 
      message: 'Viewing request sent to agent' 
    });
  } catch (err) {
    console.error('[Booking] Controller error:', err);
    next(err);
  }
};
