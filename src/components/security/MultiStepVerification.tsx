import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Security,
  Fingerprint,
  Timer,
  Warning,
  CheckCircle,
  Cancel,
  Visibility,
  VisibilityOff,
  Delete,
  Group,
  School,
  AccountBox
} from '@mui/icons-material';
import { useDeletionSecurity, VerificationData } from '../../contexts/DeletionSecurityContext';
import { useAuth } from '../../services/authContext';

interface MultiStepVerificationProps {
  open: boolean;
  onClose: () => void;
  onVerificationComplete: (verified: boolean) => void;
  studentData?: {
    id: string;
    name: string;
    hebrewName?: string;
    relations?: string[];
    impactScope?: string[];
  };
  operationType: 'single' | 'bulk' | 'cascade' | 'cleanup';
  requiresBiometric?: boolean;
}

interface VerificationStep {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
  error?: string;
}

const HEBREW_LABELS = {
  steps: {
    passwordConfirmation: 'אימות סיסמה',
    typeConfirmation: 'אישור הקלדה',
    impactAcknowledgment: 'אישור השפעה',
    biometricVerification: 'אימות ביומטרי'
  },
  impacts: {
    studentData: 'מחיקת נתוני התלמיד',
    enrollmentRecords: 'מחיקת רישומי הרשמה',
    attendanceHistory: 'מחיקת נוכחות',
    performanceRecords: 'מחיקת רישומי הופעות',
    financialRecords: 'מחיקת נתונים כספיים',
    parentContacts: 'מחיקת פרטי קשר של הורים',
    teacherAssignments: 'מחיקת שיוכי מורים',
    orchestraParticipation: 'מחיקת השתתפות בתזמורת',
    theoryClasses: 'מחיקת שיעורי תאוריה',
    instrumentAssignments: 'מחיקת שיוכי כלים',
    cascadeRelations: 'מחיקה מדורגת של כל הקשרים'
  },
  messages: {
    passwordPlaceholder: 'הכנס את הסיסמה שלך לאימות',
    typeConfirmationPlaceholder: 'הקלד את השם המלא של התלמיד',
    verificationInProgress: 'מבצע אימות...',
    verificationComplete: 'אימות הושלם בהצלחה',
    verificationFailed: 'אימות נכשל',
    timeRemaining: 'זמן נותר',
    sessionExpiring: 'תוקף ההפעלה עומד לפוג',
    confirmDeletion: 'אני מבין שפעולה זו אינה הפיכה',
    reviewImpact: 'סקרתי את ההשפעות הצפויות',
    acknowledgeRisk: 'אני מאשר את הסיכונים הכרוכים',
    finalConfirmation: 'אני מאשר את ביצוע המחיקה'
  }
};

// Time-based token component
function TimeBasedToken({ onExpire, duration = 300 }: { onExpire: () => void; duration?: number }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressValue = ((duration - timeLeft) / duration) * 100;
  const isWarning = timeLeft <= 60;
  const isCritical = timeLeft <= 30;

  return (
    <Box sx={{ direction: 'rtl', mb: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Timer 
          sx={{ 
            color: isCritical ? 'error.main' : isWarning ? 'warning.main' : 'info.main',
            fontSize: 20 
          }} 
        />
        <Typography 
          variant="body2" 
          sx={{ 
            color: isCritical ? 'error.main' : isWarning ? 'warning.main' : 'text.secondary',
            fontWeight: isWarning ? 'bold' : 'normal'
          }}
        >
          {HEBREW_LABELS.messages.timeRemaining}: {formatTime(timeLeft)}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progressValue}
        sx={{
          height: 6,
          borderRadius: 3,
          '& .MuiLinearProgress-bar': {
            backgroundColor: isCritical ? 'error.main' : isWarning ? 'warning.main' : 'success.main'
          }
        }}
      />
      {isWarning && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'warning.main',
            fontWeight: 'bold',
            mt: 0.5,
            display: 'block'
          }}
        >
          {HEBREW_LABELS.messages.sessionExpiring}
        </Typography>
      )}
    </Box>
  );
}

// Password confirmation component
function PasswordConfirmation({ 
  onComplete, 
  loading = false 
}: { 
  onComplete: (password: string) => void; 
  loading?: boolean; 
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('יש להזין סיסמה');
      return;
    }
    setError('');
    onComplete(password);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ direction: 'rtl' }}>
      <Typography variant="body2" color="text.secondary" mb={2}>
        להמשך המחיקה, יש להזין את הסיסמה שלך לאימות זהות
      </Typography>
      
      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        label="סיסמה"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={!!error}
        helperText={error}
        disabled={loading}
        sx={{ mb: 2, direction: 'rtl' }}
        InputProps={{
          endAdornment: (
            <IconButton
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          )
        }}
      />
      
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!password.trim() || loading}
        startIcon={loading ? undefined : <Security />}
      >
        {loading ? 'מאמת...' : 'אמת סיסמה'}
      </Button>
    </Box>
  );
}

// Type confirmation component
function TypeConfirmation({ 
  studentName, 
  onComplete, 
  loading = false 
}: { 
  studentName: string; 
  onComplete: (typed: string) => void; 
  loading?: boolean; 
}) {
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!typedName.trim()) {
      setError('יש להקליד את שם התלמיד');
      return;
    }
    
    if (typedName.trim() !== studentName.trim()) {
      setError('השם שהוקלד אינו תואם');
      return;
    }
    
    setError('');
    onComplete(typedName);
  };

  const isMatch = typedName.trim() === studentName.trim();
  const hasInput = typedName.length > 0;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ direction: 'rtl' }}>
      <Typography variant="body2" color="text.secondary" mb={1}>
        לאישור המחיקה, הקלד את השם המלא של התלמיד:
      </Typography>
      
      <Chip 
        label={studentName}
        color="primary"
        sx={{ mb: 2, fontSize: '1rem', height: 36 }}
      />
      
      <TextField
        fullWidth
        label="הקלד את שם התלמיד"
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
        error={hasInput && !isMatch}
        helperText={error || (hasInput && !isMatch ? 'השם אינו תואם' : '')}
        disabled={loading}
        sx={{ 
          mb: 2, 
          direction: 'rtl',
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: hasInput && isMatch ? 'success.main' : undefined
            }
          }
        }}
        InputProps={{
          endAdornment: hasInput && isMatch && (
            <CheckCircle sx={{ color: 'success.main', ml: 1 }} />
          )
        }}
      />
      
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!isMatch || loading}
        color={isMatch ? 'success' : 'primary'}
        startIcon={loading ? undefined : <CheckCircle />}
      >
        {loading ? 'מאמת...' : 'אשר שם'}
      </Button>
    </Box>
  );
}

// Impact acknowledgment component
function ImpactAcknowledgment({ 
  impacts, 
  onComplete, 
  operationType 
}: { 
  impacts: string[]; 
  onComplete: (acknowledged: boolean[]) => void;
  operationType: 'single' | 'bulk' | 'cascade' | 'cleanup';
}) {
  const [acknowledgments, setAcknowledgments] = useState<boolean[]>(new Array(impacts.length + 3).fill(false));
  
  const requiredAcknowledgments = [
    HEBREW_LABELS.messages.confirmDeletion,
    HEBREW_LABELS.messages.reviewImpact,
    HEBREW_LABELS.messages.acknowledgeRisk,
    HEBREW_LABELS.messages.finalConfirmation
  ];

  const allImpacts = [...impacts, ...requiredAcknowledgments];
  const allChecked = acknowledgments.every(Boolean);

  const handleCheckChange = (index: number) => {
    const newAcknowledgments = [...acknowledgments];
    newAcknowledgments[index] = !newAcknowledgments[index];
    setAcknowledgments(newAcknowledgments);
  };

  const getImpactIcon = (impact: string) => {
    if (impact.includes('תלמיד')) return <AccountBox />;
    if (impact.includes('הרשמה')) return <School />;
    if (impact.includes('תזמורת')) return <Group />;
    if (impact.includes('מדורגת')) return <Warning sx={{ color: 'error.main' }} />;
    return <Delete />;
  };

  const getSeverityColor = (index: number, impact: string) => {
    if (impact.includes('מדורגת') || operationType === 'cascade') return 'error.main';
    if (impact.includes('כספיים') || impact.includes('מחיקה')) return 'warning.main';
    return 'text.primary';
  };

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Alert 
        severity={operationType === 'cascade' ? 'error' : 'warning'} 
        sx={{ mb: 2, direction: 'rtl' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          פעולה זו תגרום להשפעות הבאות:
        </Typography>
      </Alert>

      <List sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
        {allImpacts.map((impact, index) => (
          <React.Fragment key={index}>
            <ListItem 
              sx={{ 
                px: 0, 
                py: 0.5,
                backgroundColor: index >= impacts.length ? 'action.hover' : 'transparent',
                borderRadius: 1,
                mb: 0.5
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {getImpactIcon(impact)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: getSeverityColor(index, impact),
                      fontWeight: index >= impacts.length ? 'bold' : 'normal'
                    }}
                  >
                    {impact}
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acknowledgments[index]}
                    onChange={() => handleCheckChange(index)}
                    color={operationType === 'cascade' ? 'error' : 'primary'}
                  />
                }
                label=""
                sx={{ ml: 0 }}
              />
            </ListItem>
            {index === impacts.length - 1 && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ textAlign: 'center' }}>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ mb: 2, display: 'block' }}
        >
          יש לאשר את כל הפריטים כדי להמשיך ({acknowledgments.filter(Boolean).length}/{allImpacts.length})
        </Typography>
        
        <Button
          variant="contained"
          color={operationType === 'cascade' ? 'error' : 'warning'}
          fullWidth
          disabled={!allChecked}
          onClick={() => onComplete(acknowledgments)}
          startIcon={<Warning />}
        >
          אני מאשר את כל ההשפעות
        </Button>
      </Box>
    </Box>
  );
}

// Biometric verification component (mock)
function BiometricVerification({ onComplete }: { onComplete: (success: boolean) => void }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'success' | 'failure' | null>(null);

  const handleBiometricScan = useCallback(() => {
    setScanning(true);
    
    // Simulate biometric scan
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      setScanResult(success ? 'success' : 'failure');
      setScanning(false);
      
      setTimeout(() => {
        onComplete(success);
      }, 1000);
    }, 2000);
  }, [onComplete]);

  return (
    <Box sx={{ textAlign: 'center', direction: 'rtl' }}>
      <Typography variant="body2" color="text.secondary" mb={3}>
        השתמש באימות ביומטרי להשלמת התהליך
      </Typography>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          mb: 3 
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid`,
            borderColor: scanResult === 'success' ? 'success.main' : 
                        scanResult === 'failure' ? 'error.main' : 'primary.main',
            animation: scanning ? 'pulse 2s infinite' : 'none',
            backgroundColor: scanResult === 'success' ? 'success.light' :
                            scanResult === 'failure' ? 'error.light' : 'primary.light',
            mb: 2
          }}
        >
          <Fingerprint 
            sx={{ 
              fontSize: 60, 
              color: scanResult === 'success' ? 'success.main' : 
                     scanResult === 'failure' ? 'error.main' : 'primary.main'
            }} 
          />
        </Box>

        {scanning && (
          <Typography variant="body2" color="primary">
            סורק טביעת אצבע...
          </Typography>
        )}

        {scanResult === 'success' && (
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
            אימות בוצע בהצלחה
          </Typography>
        )}

        {scanResult === 'failure' && (
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
            אימות נכשל, נסה שוב
          </Typography>
        )}
      </Box>

      <Button
        variant="contained"
        onClick={handleBiometricScan}
        disabled={scanning || scanResult === 'success'}
        startIcon={<Fingerprint />}
        sx={{ minWidth: 150 }}
      >
        {scanning ? 'סורק...' : scanResult === 'failure' ? 'נסה שוב' : 'התחל סריקה'}
      </Button>
    </Box>
  );
}

// Main multi-step verification component
export function MultiStepVerification({
  open,
  onClose,
  onVerificationComplete,
  studentData,
  operationType,
  requiresBiometric = false
}: MultiStepVerificationProps) {
  const { completeVerification, generateSecurityToken, recordActivity } = useDeletionSecurity();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationData>({});
  const [tokenExpired, setTokenExpired] = useState(false);
  const [error, setError] = useState<string>('');

  // Define verification steps based on operation type
  const steps: VerificationStep[] = [
    {
      id: 'password',
      label: HEBREW_LABELS.steps.passwordConfirmation,
      completed: !!verificationData.password,
      required: true
    },
    {
      id: 'type',
      label: HEBREW_LABELS.steps.typeConfirmation,
      completed: !!verificationData.typedConfirmation,
      required: operationType !== 'cleanup'
    },
    {
      id: 'impact',
      label: HEBREW_LABELS.steps.impactAcknowledgment,
      completed: !!verificationData.impactAcknowledgment,
      required: true
    },
    ...(requiresBiometric ? [{
      id: 'biometric',
      label: HEBREW_LABELS.steps.biometricVerification,
      completed: !!verificationData.biometricData,
      required: true
    }] : [])
  ].filter(step => step.required);

  // Get impact list based on operation type
  const getImpactList = (): string[] => {
    const baseImpacts = [
      HEBREW_LABELS.impacts.studentData,
      HEBREW_LABELS.impacts.attendanceHistory,
      HEBREW_LABELS.impacts.parentContacts
    ];

    switch (operationType) {
      case 'cascade':
        return [
          ...baseImpacts,
          HEBREW_LABELS.impacts.enrollmentRecords,
          HEBREW_LABELS.impacts.performanceRecords,
          HEBREW_LABELS.impacts.financialRecords,
          HEBREW_LABELS.impacts.teacherAssignments,
          HEBREW_LABELS.impacts.orchestraParticipation,
          HEBREW_LABELS.impacts.theoryClasses,
          HEBREW_LABELS.impacts.instrumentAssignments,
          HEBREW_LABELS.impacts.cascadeRelations
        ];
      case 'bulk':
        return [
          ...baseImpacts,
          HEBREW_LABELS.impacts.enrollmentRecords,
          HEBREW_LABELS.impacts.teacherAssignments
        ];
      case 'cleanup':
        return [
          'מחיקת רישומים יתומים',
          'עדכון קשרים שבורים',
          'ניקוי נתונים לא עקביים'
        ];
      default:
        return baseImpacts;
    }
  };

  // Handle step completion
  const handleStepComplete = useCallback(async (stepData: any) => {
    setLoading(true);
    setError('');
    
    try {
      const currentStepData = steps[currentStep];
      const updatedVerificationData = { ...verificationData };
      
      switch (currentStepData.id) {
        case 'password':
          updatedVerificationData.password = stepData;
          break;
        case 'type':
          updatedVerificationData.typedConfirmation = stepData;
          break;
        case 'impact':
          updatedVerificationData.impactAcknowledgment = stepData;
          break;
        case 'biometric':
          updatedVerificationData.biometricData = stepData;
          break;
      }
      
      setVerificationData(updatedVerificationData);
      recordActivity('verification_step_completed', { 
        step: currentStepData.id, 
        operationType,
        studentId: studentData?.id 
      });
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All steps completed, perform final verification
        const verificationResult = await completeVerification({
          ...updatedVerificationData,
          timeSpent: Date.now() - (verificationStartTime.current || Date.now())
        });
        
        if (verificationResult) {
          // Generate security token
          const token = await generateSecurityToken(
            `delete_${operationType}`,
            studentData?.id,
            operationType
          );
          
          recordActivity('verification_completed', { 
            operationType,
            studentId: studentData?.id,
            tokenId: token.token.substring(0, 8)
          });
          
          onVerificationComplete(true);
        } else {
          setError('אימות נכשל, נסה שוב');
          recordActivity('verification_failed', { 
            operationType,
            studentId: studentData?.id 
          });
        }
      }
    } catch (error) {
      console.error('Verification step error:', error);
      setError('שגיאה בתהליך האימות');
      recordActivity('verification_error', { 
        error: error.message,
        step: currentStep,
        operationType
      });
    } finally {
      setLoading(false);
    }
  }, [currentStep, steps, verificationData, completeVerification, generateSecurityToken, recordActivity, operationType, studentData, onVerificationComplete]);

  // Track verification start time
  const verificationStartTime = useRef<number>();

  useEffect(() => {
    if (open) {
      verificationStartTime.current = Date.now();
      recordActivity('verification_started', { operationType, studentId: studentData?.id });
    }
  }, [open, operationType, studentData, recordActivity]);

  // Handle token expiration
  const handleTokenExpire = useCallback(() => {
    setTokenExpired(true);
    recordActivity('verification_token_expired', { operationType, studentId: studentData?.id });
  }, [recordActivity, operationType, studentData]);

  // Handle dialog close
  const handleClose = () => {
    if (!tokenExpired && currentStep > 0) {
      recordActivity('verification_cancelled', { 
        step: currentStep,
        operationType,
        studentId: studentData?.id 
      });
    }
    onClose();
  };

  // Render current step content
  const renderStepContent = () => {
    if (tokenExpired) {
      return (
        <Box sx={{ textAlign: 'center', py: 4, direction: 'rtl' }}>
          <Warning sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            תוקף האימות פג
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            תהליך האימות לקח יותר מדי זמן. יש להתחיל מחדש.
          </Typography>
          <Button variant="contained" onClick={onClose}>
            סגור
          </Button>
        </Box>
      );
    }

    const currentStepData = steps[currentStep];
    
    switch (currentStepData.id) {
      case 'password':
        return (
          <PasswordConfirmation
            onComplete={handleStepComplete}
            loading={loading}
          />
        );
      case 'type':
        return (
          <TypeConfirmation
            studentName={studentData?.hebrewName || studentData?.name || ''}
            onComplete={handleStepComplete}
            loading={loading}
          />
        );
      case 'impact':
        return (
          <ImpactAcknowledgment
            impacts={getImpactList()}
            onComplete={handleStepComplete}
            operationType={operationType}
          />
        );
      case 'biometric':
        return (
          <BiometricVerification
            onComplete={handleStepComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={currentStep > 0 && !tokenExpired}
      sx={{
        '& .MuiDialog-paper': {
          direction: 'rtl'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Security sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6">
          אימות רב-שלבי למחיקה
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {studentData?.name && `תלמיד: ${studentData.name}`}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {!tokenExpired && (
          <TimeBasedToken
            onExpire={handleTokenExpire}
            duration={300} // 5 minutes
          />
        )}

        <Stepper 
          activeStep={currentStep} 
          orientation="horizontal" 
          sx={{ mb: 3, direction: 'ltr' }}
          alternativeLabel
        >
          {steps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '& .MuiStepIcon-text': {
                      fontSize: '0.875rem'
                    }
                  }
                }}
              >
                <Typography variant="caption" sx={{ direction: 'rtl' }}>
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, direction: 'rtl' }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-start', p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          startIcon={<Cancel />}
        >
          ביטול
        </Button>
        {currentStep > 0 && !tokenExpired && (
          <Button
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={loading}
          >
            חזור
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default MultiStepVerification;