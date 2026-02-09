/**
 * Comprehensive Security Integration Example
 * 
 * Demonstrates the complete integration of all security layers
 * for the cascade deletion system with real-world usage examples.
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Grid,
  Divider,
  Alert,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { Delete, Security, AdminPanelSettings, Assessment } from '@mui/icons-material';

// Import all security components
import { DeletionSecurityProvider } from '../contexts/DeletionSecurityContext';
import { DeletionPermissionGuard, AdminOnlyRoute, DeletionGuard } from '../components/security/PermissionGuards';
import { MultiStepVerification } from '../components/security/MultiStepVerification';
import { 
  SecureDeleteButton, 
  RateLimitedAction, 
  SessionValidator, 
  AutoLogoutHandler,
  withDeletionSecurity 
} from '../components/security/SecurityWrappers';
import {
  PermissionIndicator,
  SecurityStatusBar,
  AuditLogViewer,
  SuspiciousActivityAlert,
  EmergencyLockButton
} from '../components/security/SecurityUIComponents';
import SecurityErrorBoundary, { useSecurityErrorHandler } from '../components/security/SecurityErrorBoundary';
import { useDeletePermissions } from '../hooks/useDeletePermissions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Example student deletion component with full security integration
function SecureStudentDeletionComponent() {
  const [showVerification, setShowVerification] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
    hebrewName: string;
  } | null>(null);
  
  const { permissions, loading } = useDeletePermissions();
  const { handleError } = useSecurityErrorHandler();

  const mockStudents = [
    { id: 'student_001', name: 'John Doe', hebrewName: 'יוחנן דו' },
    { id: 'student_002', name: 'Jane Smith', hebrewName: 'ג\'יין סמית' },
    { id: 'student_003', name: 'David Cohen', hebrewName: 'דוד כהן' }
  ];

  const handleDeleteClick = async (student: typeof mockStudents[0]) => {
    try {
      setStudentToDelete(student);
      setShowVerification(true);
    } catch (error) {
      await handleError(error as Error, {
        component: 'SecureStudentDeletion',
        function: 'handleDeleteClick'
      });
    }
  };

  const handleVerificationComplete = async (verified: boolean) => {
    setShowVerification(false);
    
    if (verified && studentToDelete) {
      // Simulate deletion
      console.log(`מוחק תלמיד: ${studentToDelete.hebrewName}`);
      alert(`התלמיד ${studentToDelete.hebrewName} נמחק בהצלחה`);
    }
    
    setStudentToDelete(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1}>
            <Security sx={{ animation: 'pulse 1s infinite' }} />
            <Typography>טוען רכיב מחיקה מאובטח...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <DeletionGuard 
      operation="single" 
      showSecurityStatus={true}
    >
      <Card>
        <CardHeader
          title="מחיקת תלמידים מאובטחת"
          avatar={<Delete />}
          action={<PermissionIndicator variant="chip" />}
        />
        <CardContent>
          <Grid container spacing={2}>
            {mockStudents.map((student) => (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <Paper sx={{ p: 2, textAlign: 'center', direction: 'rtl' }}>
                  <Typography variant="h6" gutterBottom>
                    {student.hebrewName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {student.name}
                  </Typography>
                  
                  <DeletionPermissionGuard
                    requiredPermission="delete_single"
                    studentId={student.id}
                  >
                    <SecureDeleteButton
                      onClick={() => handleDeleteClick(student)}
                      studentId={student.id}
                      studentName={student.hebrewName}
                      operationType="single"
                      variant="outlined"
                      color="error"
                      size="small"
                      requiresVerification={true}
                      showPermissionStatus={true}
                    >
                      מחק תלמיד
                    </SecureDeleteButton>
                  </DeletionPermissionGuard>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {showVerification && studentToDelete && (
            <MultiStepVerification
              open={showVerification}
              onClose={() => setShowVerification(false)}
              onVerificationComplete={handleVerificationComplete}
              studentData={studentToDelete}
              operationType="single"
              requiresBiometric={false}
            />
          )}
        </CardContent>
      </Card>
    </DeletionGuard>
  );
}

// Secure the component with HOC
const SecureStudentDeletion = withDeletionSecurity(SecureStudentDeletionComponent, {
  requiresVerification: true,
  operationType: 'single',
  showSecurityStatus: true,
  autoRefreshSession: true
});

// Bulk deletion example
function BulkDeletionExample() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const handleBulkDelete = () => {
    console.log('Bulk deletion initiated for:', selectedStudents);
  };

  return (
    <AdminOnlyRoute requireSuperAdmin={false}>
      <Card>
        <CardHeader
          title="מחיקה קבוצתית (מנהלים בלבד)"
          avatar={<AdminPanelSettings />}
        />
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2, direction: 'rtl' }}>
            <Typography variant="body2">
              מחיקה קבוצתית דורשת הרשאות מנהל ומוגבלת למשתמש אחד כל 5 דקות
            </Typography>
          </Alert>

          <RateLimitedAction 
            action="bulk"
            onRateExceeded={() => alert('חרגת מהמגבלה של מחיקה קבוצתית')}
          >
            <DeletionGuard operation="bulk" showSecurityStatus={true}>
              <SecureDeleteButton
                onClick={handleBulkDelete}
                operationType="bulk"
                variant="contained"
                color="warning"
                requiresVerification={true}
                disabled={selectedStudents.length === 0}
              >
                מחק {selectedStudents.length} תלמידים
              </SecureDeleteButton>
            </DeletionGuard>
          </RateLimitedAction>
        </CardContent>
      </Card>
    </AdminOnlyRoute>
  );
}

// Security monitoring dashboard
function SecurityMonitoringDashboard() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <SecurityStatusBar showProgress={true} showDetails={true} />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <PermissionIndicator variant="card" showDetails={true} />
      </Grid>
      
      <Grid item xs={12}>
        <SuspiciousActivityAlert
          onDismiss={() => console.log('Alert dismissed')}
          onViewDetails={() => console.log('Viewing alert details')}
          severity="warning"
        />
      </Grid>
      
      <Grid item xs={12}>
        <AuditLogViewer
          maxEntries={20}
          showFilters={true}
          autoRefresh={true}
          refreshInterval={30000}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="בקרות חירום"
            avatar={<Security />}
          />
          <CardContent>
            <Box display="flex" gap={2} direction="rtl">
              <EmergencyLockButton
                onLock={() => alert('חשבון נעול בחירום')}
                requiresConfirmation={true}
              />
              <Button
                variant="outlined"
                color="warning"
                onClick={() => window.location.reload()}
              >
                איפוס מערכת
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// Main integration example component
export function SecurityIntegrationExample() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <SecurityErrorBoundary
      showTechnicalDetails={true}
      allowRetry={true}
      component="SecurityIntegrationExample"
    >
      <DeletionSecurityProvider>
        <SessionValidator showWarning={true} autoRefresh={true}>
          <AutoLogoutHandler
            suspiciousActivityThreshold={5}
            onSuspiciousActivity={() => alert('זוהתה פעילות חשודה - החשבון יינעל')}
          >
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Box mb={4} textAlign="center">
                <Typography variant="h3" component="h1" gutterBottom>
                  מערכת אבטחה מקיפה למחיקה מדורגת
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  דוגמא מלאה לאינטגרציית שכבות האבטחה
                </Typography>
                <Divider sx={{ my: 3 }} />
              </Box>

              <Paper sx={{ width: '100%' }}>
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  aria-label="security integration tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="מחיקה בסיסית" />
                  <Tab label="מחיקה קבוצתית" />
                  <Tab label="ניטור אבטחה" />
                </Tabs>

                <TabPanel value={currentTab} index={0}>
                  <SecureStudentDeletion />
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                  <BulkDeletionExample />
                </TabPanel>

                <TabPanel value={currentTab} index={2}>
                  <SecurityMonitoringDashboard />
                </TabPanel>
              </Paper>

              <Box mt={4}>
                <Card>
                  <CardHeader
                    title="רכיבי האבטחה המיושמים"
                    avatar={<Assessment />}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          🔒 בקרת גישה מבוססת תפקידים
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • בדיקת הרשאות לפני כל פעולה<br/>
                          • הגבלות על בסיס תפקיד המשתמש<br/>
                          • אימות ברמת הישות (תלמיד ספציפי)
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          🛡️ אימות רב-שלבי
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • אישור סיסמה<br/>
                          • אימות הקלדת שם התלמיד<br/>
                          • אישור השפעות המחיקה<br/>
                          • אימות ביומטרי (אופציונלי)
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          ⏰ הגבלת קצב פעולות
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • מחיקה בודדת: 5 פעולות לדקה<br/>
                          • מחיקה קבוצתית: פעולה אחת ל-5 דקות<br/>
                          • ניקוי מערכת: פעולה אחת לשעה<br/>
                          • חסימה זמנית בחריגה
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          👁️ זיהוי פעילות חשודה
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • מחיקות מהירות מדי<br/>
                          • ניסיונות אימות כושלים<br/>
                          • פעילות בשעות חריגות<br/>
                          • ניסיונות הסלמת הרשאות
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          📋 יומן ביקורת מקיף
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • רישום כל פעולות האבטחה<br/>
                          • מעקב אחר ניסיונות גישה<br/>
                          • תיעוד שגיאות ופרטי הפעלה<br/>
                          • ייצוא דוחות לציות תקינה
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                          🚨 טיפול בשגיאות מתקדם
                        </Typography>
                        <Typography variant="body2" paragraph>
                          • הודעות שגיאה בעברית<br/>
                          • הצעת פעולות מתקנות<br/>
                          • דיווח אוטומטי למנהלים<br/>
                          • מנגנון התאוששות אוטומטי
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            </Container>
          </AutoLogoutHandler>
        </SessionValidator>
      </DeletionSecurityProvider>
    </SecurityErrorBoundary>
  );
}

export default SecurityIntegrationExample;