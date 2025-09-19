import React, { useEffect, useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Button, ButtonGroup } from '@mui/material';
import { UserFile } from '../../../mocks/dashboardApi';
import { formatDate } from '../../../utils/formatters';
import { useAuth } from '../../../contexts/AuthContext';
import { createDashboardService } from '../../../services/dashboardService';

const FileTable: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [groupedFiles, setGroupedFiles] = useState<Record<string, UserFile[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('identity'); // Default to 'identity'

  // Fetch files from the dashboard service
  useEffect(() => {
    const fetchFiles = async () => {
      console.log('🔍 YourFiles - Fetching files for user:', user?.id);
      const dashboardService = createDashboardService(user?.id);
      const response = await dashboardService.getUserFiles();
      if (response.success) {
        setFiles(response.data || []);

        // Group files by category
        const grouped = (response.data ?? []).reduce((acc: Record<string, UserFile[]>, file) => {
          if (!acc[file.category]) {
            acc[file.category] = [];
          }
          acc[file.category].push(file);
          return acc;
        }, {});
        setGroupedFiles(grouped);
        console.log('📁 YourFiles - Grouped files:', grouped);
      } else {
        console.error('YourFiles - Failed to fetch files:', response.error);
      }
    };

    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id]);

  // Render the table for the active category
  const renderTable = (category: string) => {
    const files = groupedFiles[category] || [];
    return (
      <TableContainer component={Paper} sx={{ marginTop: 2, backgroundColor: '#FFFFFF' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size (KB)</TableCell>
              <TableCell>Uploaded At</TableCell>
              <TableCell>Actions</TableCell> {/* New column for actions */}
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{(file.size / 1024).toFixed(2)}</TableCell>
                <TableCell>{new Date(file.uploadedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {/* View Button */}
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      // Handle both data URLs and regular URLs
                      if (file.url.startsWith('data:')) {
                        // For data URLs, open in new window
                        const newWindow = window.open();
                        if (newWindow) {
                          newWindow.document.write(`
                            <html>
                              <head><title>${file.name}</title></head>
                              <body style="margin:0;padding:20px;">
                                ${file.type.startsWith('image/') 
                                  ? `<img src="${file.url}" style="max-width:100%;height:auto;" alt="${file.name}">`
                                  : `<iframe src="${file.url}" style="width:100%;height:90vh;border:none;"></iframe>`
                                }
                              </body>
                            </html>
                          `);
                        }
                      } else {
                        // For regular URLs, open directly
                        window.open(file.url, '_blank');
                      }
                    }}
                    sx={{ marginRight: 1 }}
                  >
                    View
                  </Button>
                  {/* Download Button */}
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.url;
                      link.download = file.name;
                      link.click();
                    }}
                  >
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#EDF3FA', borderRadius: 2, height: '100%', gap: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        User Files
      </Typography>
               <div className="Yourfilescard bg-white p-4 rounded-lg shadow flex items-center" style={{ gap: '1rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 'auto', width: '230px', border: '1px solid #81B0F8'}}>
                <div style={{ gap: '0.2rem', display: 'flex', flexDirection: 'column', justifyContent: 'start', alignItems: 'start', }}>
                    <h2 className="text-xl font-semibold">{files.length}</h2>
                  <p className="text-gray-600">Your files</p>
                  <p className="text-xs text-gray-500">As of {formatDate(new Date().toISOString())}</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1919_20188)">
                <path d="M15.8333 2.49967H10.3933C10.2645 2.50053 10.1371 2.47203 10.0208 2.41634L7.39083 1.09634C7.04366 0.923462 6.66117 0.83333 6.27333 0.833008H4.16667C3.062 0.834331 2.00296 1.27374 1.22185 2.05486C0.440735 2.83597 0.00132321 3.89501 0 4.99967L0 14.9997C0.00132321 16.1043 0.440735 17.1634 1.22185 17.9445C2.00296 18.7256 3.062 19.165 4.16667 19.1663H15.8333C16.938 19.165 17.997 18.7256 18.7782 17.9445C19.5593 17.1634 19.9987 16.1043 20 14.9997V6.66634C19.9987 5.56168 19.5593 4.50264 18.7782 3.72152C17.997 2.94041 16.938 2.501 15.8333 2.49967ZM4.16667 2.49967H6.27333C6.40222 2.49882 6.5296 2.52732 6.64583 2.58301L9.27583 3.89884C9.62266 4.07316 10.0052 4.16473 10.3933 4.16634H15.8333C16.3317 4.16715 16.8184 4.3169 17.2311 4.59635C17.6437 4.8758 17.9634 5.27221 18.1492 5.73467L1.66667 5.82801V4.99967C1.66667 4.33663 1.93006 3.70075 2.3989 3.23191C2.86774 2.76307 3.50363 2.49967 4.16667 2.49967ZM15.8333 17.4997H4.16667C3.50363 17.4997 2.86774 17.2363 2.3989 16.7674C1.93006 16.2986 1.66667 15.6627 1.66667 14.9997V7.49467L18.3333 7.40051V14.9997C18.3333 15.6627 18.0699 16.2986 17.6011 16.7674C17.1323 17.2363 16.4964 17.4997 15.8333 17.4997Z" fill="#DC5F12"/>
                </g>

                </svg>
              </div>

      {/* Navigation Buttons */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <nav className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'identity' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveCategory('identity')}
          >
            Identity Files
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'financial' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveCategory('financial')}
          >
            Financial Files
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'residential' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveCategory('residential')}
          >
            Residential Files
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'employment' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveCategory('employment')}
          >
            Employment Files
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${activeCategory === 'guarantor' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveCategory('guarantor')}
          >
            Guarantor Files
          </button>
        </nav>
      </div>

      {/* Render the table for the selected category */}
      {renderTable(activeCategory)}
    </Box>
  );
};

export default FileTable;