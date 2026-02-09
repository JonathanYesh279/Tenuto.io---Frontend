/**
 * Security-Aware Error Boundary
 * 
 * React Error Boundary component with comprehensive security error handling,
 * Hebrew support, and audit logging integration.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Button,
  Typography,
  Card,
  CardContent,
  CardActions,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning,
  Refresh,
  ExpandMore,
  ExpandLess,
  Security,
  BugReport,
  Home,
  ContactSupport
} from '@mui/icons-material';
import { 
  SecurityError, 
  handleSecurityError, 
  formatErrorForUser,
  securityErrorHandlers
} from '../../utils/securityErrorHandler';
import { securityAuditService } from '../../services/securityAuditService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: SecurityError, errorInfo: ErrorInfo) => void;
  showTechnicalDetails?: boolean;
  allowRetry?: boolean;
  userId?: string;
  userRole?: string;
  component?: string;
}

interface State {
  hasError: boolean;
  error: SecurityError | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
  isRetrying: boolean;
}

const HEBREW_MESSAGES = {
  title: 'שגיאה במערכת',
  description: 'אירעה שגיאה לא צפויה. צוות התמיכה הטכנית קיבל התראה.',
  technicalDetails: 'פרטים טכניים',
  hideDetails: 'הסתר פרטים',
  showDetails: 'הצג פרטים',
  retry: 'נסה שוב',
  goHome: 'חזור לעמוד הבית',
  contactSupport: 'פנה לתמיכה',
  refresh: 'רענן דף',
  whatHappened: 'מה קרה?',
  whatCanIDo: 'מה אני יכול לעשות?',
  errorCode: 'קוד שגיאה',
  timestamp: 'זמן השגיאה',
  retryAttempt: 'ניסיון מספר {count}',
  maxRetriesReached: 'הגעת למספר המקסימלי של ניסיונות',
  securityError: 'שגיאת אבטחה',
  systemError: 'שגיאת מערכת',
  reportSent: 'דוח השגיאה נשלח לצוות התמיכה'
};

export class SecurityErrorBoundary extends Component<Props, State> {
  private retryTimer?: NodeJS.Timeout;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Convert to SecurityError and handle
    const securityError = await handleSecurityError(error, {
      userId: this.props.userId,
      userRole: this.props.userRole,
      component: this.props.component || 'ErrorBoundary',
      function: 'componentDidCatch',
      timestamp: new Date()
    });

    // Log to security audit
    await this.logErrorToAudit(securityError, errorInfo);

    this.setState({
      error: securityError,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(securityError, errorInfo);
    }
  }

  private async logErrorToAudit(error: SecurityError, errorInfo: ErrorInfo) {
    try {
      await securityAuditService.logSecurityEvent({
        eventType: 'security_violation',
        severity: error.severity === 'critical' ? 'critical' : 
                 error.severity === 'high' ? 'error' : 'warning',
        userId: this.props.userId,
        userRole: this.props.userRole,
        details: {
          action: 'error_boundary_triggered',
          resource: 'frontend_component',
          failureReason: error.code,
          additionalData: {
            errorMessage: error.message,
            hebrewMessage: error.hebrewMessage,
            componentStack: errorInfo.componentStack,
            errorStack: error.stack,
            component: this.props.component
          }
        }
      });
    } catch (auditError) {
      console.error('Failed to log error to audit:', auditError);
    }
  }

  private handleRetry = async () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Log retry attempt
    if (this.props.userId) {
      await securityAuditService.logSecurityEvent({
        eventType: 'security_violation',
        severity: 'info',
        userId: this.props.userId,
        details: {
          action: 'error_retry_attempt',
          resource: 'frontend_component',
          additionalData: {
            retryCount: retryCount + 1,
            component: this.props.component
          }
        }
      });
    }

    // Wait a bit before retrying
    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false
      });
    }, 1000);
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleContactSupport = () => {
    // In a real implementation, this would open a support ticket or email
    const subject = encodeURIComponent(`שגיאת מערכת - ${this.state.error?.code}`);
    const body = encodeURIComponent(`
      שלום,
      
      אני נתקלתי בשגיאה במערכת:
      
      קוד שגיאה: ${this.state.error?.code}
      הודעה: ${this.state.error?.hebrewMessage}
      זמן: ${new Date().toLocaleString('he-IL')}
      דפדפן: ${navigator.userAgent}
      
      תודה,
    `);
    
    window.open(`mailto:support@conservatory.example?subject=${subject}&body=${body}`);
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private renderErrorIcon() {
    const { error } = this.state;
    
    if (!error) return <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />;
    
    switch (error.category) {
      case 'authentication':
      case 'authorization':
        return <Security sx={{ fontSize: 48, color: 'warning.main' }} />;
      case 'suspicious_activity':
        return <Warning sx={{ fontSize: 48, color: 'error.main' }} />;
      case 'system':
      default:
        return <BugReport sx={{ fontSize: 48, color: 'error.main' }} />;
    }
  }

  private renderErrorContent() {
    const { error } = this.state;
    
    if (!error) {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            {HEBREW_MESSAGES.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {HEBREW_MESSAGES.description}
          </Typography>
        </Box>
      );
    }

    const userError = formatErrorForUser(error);

    return (
      <Box>
        <Typography variant="h6" gutterBottom color={`${userError.severity}.main`}>
          {userError.title}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {userError.message}
        </Typography>
        
        {userError.actions.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              {HEBREW_MESSAGES.whatCanIDo}
            </Typography>
            <List dense>
              {userError.actions.map((action, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText
                    primary={`• ${action}`}
                    sx={{ direction: 'rtl', textAlign: 'right' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  }

  private renderTechnicalDetails() {
    const { error, errorInfo, showDetails } = this.state;
    
    if (!error || !this.props.showTechnicalDetails) return null;

    return (
      <Box mt={2}>
        <Button
          onClick={this.toggleDetails}
          startIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
          size="small"
          sx={{ direction: 'ltr' }}
        >
          {showDetails ? HEBREW_MESSAGES.hideDetails : HEBREW_MESSAGES.showDetails}
        </Button>
        
        <Collapse in={showDetails}>
          <Card variant="outlined" sx={{ mt: 1, backgroundColor: 'grey.50' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                {HEBREW_MESSAGES.technicalDetails}
              </Typography>
              
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  {HEBREW_MESSAGES.errorCode}: {error.code}
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                  {HEBREW_MESSAGES.timestamp}: {new Date().toLocaleString('he-IL')}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                {error.message}
              </Typography>

              {error.technicalDetails && (
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                  {JSON.stringify(error.technicalDetails, null, 2)}
                </Typography>
              )}

              {errorInfo && (
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {errorInfo.componentStack}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Collapse>
      </Box>
    );
  }

  private renderActions() {
    const { retryCount, isRetrying } = this.state;
    const canRetry = this.props.allowRetry !== false && retryCount < this.maxRetries;

    return (
      <CardActions sx={{ justifyContent: 'flex-start', direction: 'rtl' }}>
        {canRetry && (
          <Button
            onClick={this.handleRetry}
            disabled={isRetrying}
            startIcon={isRetrying ? undefined : <Refresh />}
            variant="contained"
          >
            {isRetrying ? 'מנסה שוב...' : HEBREW_MESSAGES.retry}
          </Button>
        )}
        
        <Button
          onClick={this.handleRefresh}
          startIcon={<Refresh />}
          variant="outlined"
        >
          {HEBREW_MESSAGES.refresh}
        </Button>
        
        <Button
          onClick={this.handleGoHome}
          startIcon={<Home />}
          variant="outlined"
        >
          {HEBREW_MESSAGES.goHome}
        </Button>
        
        <Button
          onClick={this.handleContactSupport}
          startIcon={<ContactSupport />}
          variant="text"
        >
          {HEBREW_MESSAGES.contactSupport}
        </Button>
      </CardActions>
    );
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // If custom fallback is provided, use it
    if (fallback) {
      return fallback;
    }

    // Default error UI
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          p: 3,
          direction: 'rtl'
        }}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                mb: 3
              }}
            >
              {this.renderErrorIcon()}
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              {this.renderErrorContent()}
              {this.renderTechnicalDetails()}
            </Box>

            {this.state.retryCount > 0 && (
              <Alert severity="info" sx={{ mt: 2, direction: 'rtl' }}>
                <Typography variant="body2">
                  {HEBREW_MESSAGES.retryAttempt.replace('{count}', String(this.state.retryCount))}
                </Typography>
              </Alert>
            )}

            {this.state.retryCount >= this.maxRetries && (
              <Alert severity="warning" sx={{ mt: 2, direction: 'rtl' }}>
                <Typography variant="body2">
                  {HEBREW_MESSAGES.maxRetriesReached}
                </Typography>
              </Alert>
            )}
          </CardContent>

          {this.renderActions()}
        </Card>
      </Box>
    );
  }
}

// Hook for functional components to handle errors
export function useSecurityErrorHandler() {
  const handleError = async (
    error: Error,
    context: {
      userId?: string;
      userRole?: string;
      component?: string;
      function?: string;
    } = {}
  ) => {
    return await handleSecurityError(error, {
      timestamp: new Date(),
      ...context
    });
  };

  return { handleError, securityErrorHandlers };
}

export default SecurityErrorBoundary;