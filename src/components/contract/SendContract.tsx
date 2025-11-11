import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, AlertCircle } from 'lucide-react';
import { useSignedContracts } from '../../contexts/SignedContractsContext';
import { useAuth } from '../../contexts/AuthContext';
import UserService, { User } from '../../services/userService';
import contractEmailService from '../../services/contractEmailService';
import signedContractsFirestoreService from '../../services/signedContractsFirestoreService';
import contractSyncService from '../../services/contractSyncService';

interface SendContractProps {
  contractData: {
    title?: string;
    content: string;
    extractedFields?: {
      landlord?: string;
      tenant?: string;
      propertyAddress?: string;
      startDate?: string;
    };
  };
  signedPdfBytes?: Uint8Array | null;
  onSend: (recipients: string[], signature?: File) => void;
  onClose?: () => void;
}


const SendContract: React.FC<SendContractProps> = ({ contractData, signedPdfBytes, onSend, onClose }) => {
  const { addSignedContract } = useSignedContracts();
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<Array<{name: string, email: string, isRegistered: boolean}>>([{name: '', email: '', isRegistered: false}]);
  const [users, setUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load real users from API with MSAL fallback
  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log('🔄 SendContract - Attempting to load users from API...');
        
        // Try to get users from the API first
        const result = await UserService.getAllUsers();
        
        if (result.success && result.users && result.users.length > 0) {
          console.log('✅ SendContract - Successfully loaded users from API:', result.users.length);
          setUsers(result.users);
        } else {
          console.log('⚠️ SendContract - API failed, using MSAL user data');
          await loadUsersFromMSAL();
        }
      } catch (error) {
        console.error('❌ SendContract - API error, falling back to MSAL:', error);
        await loadUsersFromMSAL();
      }
    };

    const loadUsersFromMSAL = async () => {
      try {
        console.log('🔄 SendContract - Loading users from MSAL...');
        
        // Get current user info from MSAL
        const currentUser = user;
        if (currentUser) {
          console.log('✅ SendContract - Current user:', currentUser.name, currentUser.email);
          
          // Create a user list with the current user and some realistic contacts
          const msalUsers: User[] = [
            {
              id: currentUser.id || 'current-user',
              name: currentUser.name || 'Current User',
              email: currentUser.email || '',
              role: 'user'
            },
            // Add some realistic contacts for property management
            { id: 'admin-1', name: 'Property Admin', email: 'admin@proptii.com', role: 'admin' },
            { id: 'manager-1', name: 'Property Manager', email: 'manager@proptii.com', role: 'user' },
            { id: 'legal-1', name: 'Legal Team', email: 'legal@proptii.com', role: 'user' },
            { id: 'support-1', name: 'Support Team', email: 'support@proptii.com', role: 'user' },
          ];
          
          setUsers(msalUsers);
          console.log('✅ SendContract - Loaded MSAL users:', msalUsers.length);
        } else {
          console.log('⚠️ SendContract - No MSAL user, using fallback data');
          const fallbackUsers: User[] = [
            { id: 'fallback-1', name: 'Property Contact', email: 'contact@proptii.com', role: 'user' },
            { id: 'fallback-2', name: 'Landlord', email: 'landlord@proptii.com', role: 'user' },
            { id: 'fallback-3', name: 'Tenant', email: 'tenant@proptii.com', role: 'user' },
          ];
          setUsers(fallbackUsers);
        }
      } catch (error) {
        console.error('❌ SendContract - Error loading MSAL users:', error);
        // Final fallback
        const emergencyUsers: User[] = [
          { id: 'emergency-1', name: 'Contact Person', email: 'contact@proptii.com', role: 'user' },
        ];
        setUsers(emergencyUsers);
      }
    };

    loadUsers();
  }, [user]);

  // Handle recipient name input changes
  const handleNameChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index].name = value;
    
    // Check if user exists in authentication table
    const matchingUser = users.find(user => 
      user.name.toLowerCase().includes(value.toLowerCase()) && value.length > 0
    );
    
    if (matchingUser) {
      newRecipients[index].email = matchingUser.email;
      newRecipients[index].isRegistered = true;
    } else {
      newRecipients[index].isRegistered = false;
    }
    
    setRecipients(newRecipients);
    
    // Show suggestions if there are matches
    if (value.length > 0) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      const newShowSuggestions = [...showSuggestions];
      newShowSuggestions[index] = filtered.length > 0;
      setShowSuggestions(newShowSuggestions);
    } else {
      const newShowSuggestions = [...showSuggestions];
      newShowSuggestions[index] = false;
      setShowSuggestions(newShowSuggestions);
    }
  };

  // Handle recipient email input changes
  const handleEmailChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index].email = value;
    
    // Check if email exists in authentication table (from cached users)
    if (value.trim()) {
      const matchingUser = users.find(user => user.email.toLowerCase() === value.toLowerCase());
      newRecipients[index].isRegistered = !!matchingUser;
      
      // If user found, also update the name
      if (matchingUser) {
        newRecipients[index].name = matchingUser.name;
      }
    } else {
      newRecipients[index].isRegistered = false;
    }
    
    setRecipients(newRecipients);
  };

  // Select user from suggestions
  const selectUser = (index: number, user: User) => {
    const newRecipients = [...recipients];
    newRecipients[index].name = user.name;
    newRecipients[index].email = user.email;
    newRecipients[index].isRegistered = true;
    setRecipients(newRecipients);
    
    const newShowSuggestions = [...showSuggestions];
    newShowSuggestions[index] = false;
    setShowSuggestions(newShowSuggestions);
  };

  // Add new recipient field
  const addRecipient = () => {
    setRecipients([...recipients, {name: '', email: '', isRegistered: false}]);
    setShowSuggestions([...showSuggestions, false]);
  };

  // Remove recipient field
  const removeRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
    
    const newShowSuggestions = [...showSuggestions];
    newShowSuggestions.splice(index, 1);
    setShowSuggestions(newShowSuggestions);
  };


  // Handle form submission
  const handleSubmit = async () => {
    const validRecipients = recipients.filter(recipient => 
      recipient.name.trim() !== '' && recipient.email.trim() !== ''
    );
    
    if (validRecipients.length === 0) {
      alert('Please add at least one recipient with both name and email.');
      return;
    }

    // Check if document is signed
    if (!signedPdfBytes) {
      alert('Please sign the document first before sending. Go to the "Edit" tab to sign the contract.');
      return;
    }

    try {
      // Send emails to all recipients with the signed PDF
      console.log('📧 Sending signed contract emails to', validRecipients.length, 'recipient(s)...');
      
      const emailPromises = validRecipients.map(async (recipient) => {
        try {
          const emailResult = await contractEmailService.sendSignedContractEmail({
            to: recipient.email,
            recipientName: recipient.name,
            contractName: contractData.title || 'Contract Document',
            signedPdfBytes: signedPdfBytes,
            documentName: `${(contractData.title || 'contract').replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`,
            senderName: 'Proptii Team',
            senderEmail: 'noreply@proptii.com'
          });
          
          if (emailResult.success) {
            console.log(`✅ Email sent successfully to ${recipient.email}:`, emailResult.messageId);
            return { success: true, email: recipient.email };
          } else {
            console.error(`❌ Email sending failed for ${recipient.email}:`, emailResult.error);
            return { success: false, email: recipient.email, error: emailResult.error };
          }
        } catch (error) {
          console.error(`❌ Error sending email to ${recipient.email}:`, error);
          return { success: false, email: recipient.email, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const emailResults = await Promise.all(emailPromises);
      const successfulEmails = emailResults.filter(r => r.success);
      const failedEmails = emailResults.filter(r => !r.success);

      // Check if any recipients are landlords/agents
      console.log('🔍 Checking if recipients are landlords/agents...');
      const recipientEmailList = validRecipients.map(r => r.email);
      const landlordCheck = await contractSyncService.checkRecipientsForLandlords(recipientEmailList);
      
      if (landlordCheck.hasLandlords && landlordCheck.landlords.length > 0) {
        console.log('✅ Found landlord/agent recipients:', landlordCheck.landlords.length);
        console.log('📋 Landlords:', landlordCheck.landlords.map(l => `${l.name} (${l.email})`).join(', '));
      }

      // Save or update contract in Firestore with complete data including signed PDF
      console.log('🔄 Saving signed contract to Firestore via Send button...');
      
      try {
        const userId = user?.id || 'dev-user-123'; // Fallback for development
        
        // Convert signed PDF bytes to base64 data URL (using Promise wrapper)
        // Convert Uint8Array to ArrayBuffer for Blob constructor
        const pdfArrayBuffer = signedPdfBytes.buffer instanceof ArrayBuffer
          ? signedPdfBytes.buffer.slice(
              signedPdfBytes.byteOffset,
              signedPdfBytes.byteOffset + signedPdfBytes.byteLength
            )
          : new ArrayBuffer(signedPdfBytes.length);
        
        // If we created a new buffer, copy the data
        if (!(signedPdfBytes.buffer instanceof ArrayBuffer)) {
          const uint8View = new Uint8Array(pdfArrayBuffer);
          uint8View.set(signedPdfBytes);
        }
        
        const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        const dataUrlBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });
        
        // Save complete contract data to Firestore
        const signedContractData = {
          templateId: 'template-id', // TODO: Get from template prop
          templateName: contractData.title || 'Contract Document',
          propertyName: contractData.extractedFields?.propertyAddress?.split(',')[0] || 'Contract Property',
          propertyAddress: contractData.extractedFields?.propertyAddress || 'Contract Property Address',
          agentName: validRecipients[0].name || user?.name || 'Agent',
          agentEmail: validRecipients[0].email || user?.email || 'agent@example.com',
          tenantName: validRecipients[0].name || 'Tenant',
          tenantEmail: validRecipients[0].email || 'tenant@example.com',
          signedDate: new Date().toISOString(),
          documentUrl: blobUrl,
          documentBase64: dataUrlBase64,
          documentName: `${(contractData.title || 'contract').replace(/[^a-zA-Z0-9]/g, '_')}_signed.pdf`,
          documentSize: signedPdfBytes.length,
          documentType: 'application/pdf',
          status: 'sent' as const,
          emailSent: true,
          emailSentDate: new Date().toISOString()
        };
        
        const result = await signedContractsFirestoreService.saveSignedContract(userId, signedContractData);
        
        if (result.success) {
          console.log('✅ Signed contract saved to Firestore successfully:', result.contractId);
          
          // If any recipients are landlords/agents, sync to landlord dashboard
          if (landlordCheck.hasLandlords && landlordCheck.landlords.length > 0) {
            console.log('🔄 Syncing signed contract to landlord dashboard(s)...');
            
            // Get the full signed contract data that was just saved
            const savedContract = await signedContractsFirestoreService.getSignedContractById(result.contractId!);
            
            if (savedContract.success && savedContract.contract) {
              const landlordEmails = landlordCheck.landlords.map(l => l.email);
              const syncResult = await contractSyncService.syncToMultipleLandlords(
                savedContract.contract,
                landlordEmails
              );
              
              if (syncResult.success) {
                console.log(`✅ Successfully synced to ${syncResult.syncedCount} landlord dashboard(s)`);
                console.log('📊 Sync results:', syncResult.results);
              } else {
                console.error('❌ Failed to sync to landlord dashboards');
              }
            }
          }
        } else {
          console.error('❌ Failed to save signed contract to Firestore:', result.error);
        }
      } catch (firestoreError) {
        console.error('❌ Error saving contract to Firestore:', firestoreError);
        // Continue even if Firestore save fails - emails are more important
      }
      
      // Call the original onSend function
      const emails = validRecipients.map(r => r.email);
      onSend(emails);
      
      // Show success modal with email results
      if (successfulEmails.length === validRecipients.length) {
        setShowSuccessModal(true);
      } else if (successfulEmails.length > 0) {
        alert(`Emails sent to ${successfulEmails.length} recipient(s). ${failedEmails.length} email(s) failed. Check console for details.`);
        setShowSuccessModal(true);
      } else {
        alert(`Failed to send emails to all recipients. Check console for details.`);
      }
      
    } catch (error) {
      console.error('❌ Error sending contract:', error);
      alert('Error sending contract. Please try again.');
    }
  };

  return (
    <>
      <div className="bg-white rounded-md p-8 pb-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Contract</h2>

      {/* Recipients Section */}
      <div className="mb-6">
        {!signedPdfBytes && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">Please sign the document first</p>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Go to the "Edit" tab to sign the contract before sending it to recipients.
            </p>
          </div>
        )}
        <label className="block text-gray-700 mb-2">Recipient{recipients.length > 1 ? 's' : ''}</label>
        {recipients.map((recipient, index) => (
          <div key={index} className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <UserIcon className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Recipient {index + 1}</span>
            {recipients.length > 1 && (
              <button 
                onClick={() => removeRecipient(index)}
                  className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            )}
          </div>
            
            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Input */}
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter recipient name"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions[index] && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => selectUser(index, user)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <UserIcon className="w-4 h-4 text-gray-500 mr-2" />
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
      </div>
                      ))}
          </div>
            )}
          </div>
        </div>
              
              {/* Email Input */}
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={recipient.email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="email@example.com"
                />
                {!recipient.email && (
                  <Mail className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                )}
                </div>
              </div>
      </div>

            {/* Registration Status */}
            {recipient.name && recipient.email && (
              <div className={`flex items-center text-sm ${
                recipient.isRegistered ? 'text-green-600' : 'text-orange-600'
              }`}>
                {recipient.isRegistered ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Registered user</span>
                  </>
          ) : (
            <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span>Not registered yet - they will need to create an account</span>
            </>
          )}
        </div>
            )}
          </div>
        ))}
        
        <button 
          onClick={addRecipient}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center"
        >
           <UserIcon className="w-4 h-4 mr-1" />
          + Add another recipient
        </button>
      </div>



      {/* Send Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleSubmit}
          disabled={!signedPdfBytes}
          className={`font-medium py-3 px-12 rounded-md transition-colors text-lg w-full max-w-md ${
            signedPdfBytes
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {signedPdfBytes ? 'Send Contract' : 'Please Sign Document First'}
        </button>
      </div>
    </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Contract Sent Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your signed contract has been sent to {recipients.filter(r => r.name.trim() !== '' && r.email.trim() !== '').length} recipient(s) and added to your signed contracts.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                if (onClose) {
                  onClose();
                }
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SendContract;