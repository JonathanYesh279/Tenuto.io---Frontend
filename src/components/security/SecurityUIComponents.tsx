/**
 * Security UI Components
 * 
 * Comprehensive security-related UI components with Hebrew support
 * for the cascade deletion system.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Badge,
  LinearProgress,
  IconButton,
  Button,
  Alert,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Security,
  SecurityOutlined,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Block,
  Refresh,
  Visibility,
  VisibilityOff,
  FilterList,
  Download,
  Emergency,
  Shield,
  Timer,
  PersonOff,
  AdminPanelSettings,
  Groups,
  School,
  Delete,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useDeletionSecurity } from '../../contexts/DeletionSecurityContext';
import { useDeletePermissions } from '../../hooks/useDeletePermissions';
import { useAuth } from '../../services/authContext';
import { securityAuditService, SecurityAuditEvent } from '../../services/securityAuditService';

// Component Props Interfaces
interface PermissionIndicatorProps {
  userId?: string;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'badge' | 'chip' | 'card';
}

interface SecurityStatusBarProps {
  showProgress?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

interface AuditLogViewerProps {
  userId?: string;
  maxEntries?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface SuspiciousActivityAlertProps {
  onDismiss?: () => void;
  onViewDetails?: () => void;
  severity?: 'warning' | 'error' | 'critical';
}

interface EmergencyLockButtonProps {
  onLock?: () => void;
  requiresConfirmation?: boolean;
  disabled?: boolean;
}

// Hebrew labels and messages
const HEBREW_LABELS = {
  permissions: {
    full: 'הרשאה מלאה',
    limited: 'הרשאה מוגבלת',
    own: 'הרשאה עצמית',
    none: 'אין הרשאה',
    single: 'מחיקת יחיד',
    bulk: 'מחיקה קבוצתית',
    cascade: 'מחיקה מדורגת',
    cleanup: 'ניקוי מערכת'
  },
  security: {
    status: 'סטטוס אבטחה',
    active: 'פעיל',
    warning: 'אזהרה',
    critical: 'קריטי',
    secure: 'מאובטח',
    vulnerable: 'פגיע',
    sessionValid: 'הפעלה תקפה',
    sessionExpiring: 'הפעלה פגה',
    rateLimitOk: 'מגבלות תקינות',
    rateLimitWarning: 'חרגת מהמגבלה',
    noSuspiciousActivity: 'לא זוהתה פעילות חשודה',
    suspiciousActivity: 'פעילות חשודה זוהתה'
  },
  actions: {
    viewDetails: 'הצג פרטים',
    hideDetails: 'הסתר פרטים',
    refresh: 'רענן',
    filter: 'סנן',
    export: 'ייצא',
    lock: 'נעל חשבון',
    unlock: 'בטל נעילה',
    dismiss: 'התעלם',
    emergency: 'חירום',
    confirm: 'אשר',
    cancel: 'ביטול'
  },
  audit: {
    title: 'יומן ביקורת אבטחה',
    noEntries: 'לא נמצאו רישומים',
    timestamp: 'זמן',
    user: 'משתמש',
    action: 'פעולה',
    severity: 'חומרה',
    details: 'פרטים',
    filterBy: 'סנן לפי',
    showAll: 'הצג הכול',
    lastUpdated: 'עודכן לאחרונה'
  }
};

/**
 * Permission Indicator Component
 * Shows user's deletion permissions with visual indicators
 */
export function PermissionIndicator({ 
  userId, 
  showDetails = true,
  size = 'medium',
  variant = 'badge'
}: PermissionIndicatorProps) {
  const { permissions, loading } = useDeletePermissions();
  const { user } = useAuth();
  
  const effectiveUserId = userId || user?.id;
  const userRole = user?.role || user?.userData?.role;

  const permissionLevel = useMemo(() => {
    if (!permissions.canDelete) return { level: 'none', color: 'error' as const };
    if (permissions.canCascadeDelete) return { level: 'full', color: 'success' as const };
    if (permissions.canBulkDelete) return { level: 'limited', color: 'warning' as const };
    if (permissions.canDelete) return { level: 'own', color: 'info' as const };
    return { level: 'none', color: 'error' as const };
  }, [permissions]);

  const permissionDetails = useMemo(() => {
    const details = [];
    if (permissions.canDelete) details.push(HEBREW_LABELS.permissions.single);
    if (permissions.canBulkDelete) details.push(HEBREW_LABELS.permissions.bulk);
    if (permissions.canCascadeDelete) details.push(HEBREW_LABELS.permissions.cascade);
    if (permissions.canCleanupOrphans) details.push(HEBREW_LABELS.permissions.cleanup);
    return details;
  }, [permissions]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Security sx={{ animation: 'pulse 1s infinite', fontSize: size === 'small' ? 16 : size === 'large' ? 32 : 24 }} />
        <Typography variant={size === 'small' ? 'caption' : 'body2'}>
          בודק הרשאות...
        </Typography>
      </Box>
    );
  }

  const icon = <AdminPanelSettings sx={{ 
    fontSize: size === 'small' ? 16 : size === 'large' ? 32 : 24 
  }} />;

  const content = (
    <Box sx={{ direction: 'rtl', textAlign: 'right' }}>
      <Typography variant={size === 'small' ? 'caption' : 'body2'} sx={{ fontWeight: 'bold' }}>
        {HEBREW_LABELS.permissions[permissionLevel.level]}
      </Typography>
      {showDetails && permissionDetails.length > 0 && (
        <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
          {permissionDetails.join(' • ')}
        </Typography>
      )}
    </Box>
  );

  switch (variant) {
    case 'badge':
      return (
        <Badge 
          color={permissionLevel.color} 
          variant="dot"
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Tooltip title={permissionDetails.join(', ')} placement="top">
            <Box display="flex" alignItems="center" gap={1}>
              {icon}
              {content}
            </Box>
          </Tooltip>
        </Badge>
      );

    case 'chip':
      return (
        <Chip
          icon={icon}
          label={HEBREW_LABELS.permissions[permissionLevel.level]}
          color={permissionLevel.color}
          size={size === 'large' ? 'medium' : 'small'}
          variant="outlined"
        />
      );

    case 'card':
      return (
        <Card variant="outlined" sx={{ minWidth: 200 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              {icon}
              <Typography variant="h6">הרשאות מחיקה</Typography>
            </Box>
            {content}
            {showDetails && permissions.restrictions.length > 0 && (
              <Box mt={1}>
                <Typography variant="caption" color="warning.main">
                  מגבלות: {permissions.restrictions.join(', ')}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      );

    default:
      return <>{content}</>;
  }
}

/**
 * Security Status Bar Component
 * Shows overall security status and active protections
 */
export function SecurityStatusBar({ 
  showProgress = true,
  showDetails = false,
  compact = false
}: SecurityStatusBarProps) {
  const { securityState, isSessionValid } = useDeletionSecurity();
  const { securityStatus } = useDeletePermissions();
  const [expanded, setExpanded] = useState(showDetails);

  const overallStatus = useMemo(() => {
    if (securityState.suspiciousActivityDetected) return { level: 'critical', color: 'error' as const };
    if (securityState.rateLimitStatus.isLocked) return { level: 'critical', color: 'error' as const };
    if (!isSessionValid()) return { level: 'warning', color: 'warning' as const };
    if (securityStatus.rateLimitStatus === 'warning') return { level: 'warning', color: 'warning' as const };
    return { level: 'secure', color: 'success' as const };
  }, [securityState, securityStatus, isSessionValid]);

  const statusItems = useMemo(() => [
    {
      label: HEBREW_LABELS.security.sessionValid,
      status: isSessionValid() ? 'ok' : 'error',
      icon: isSessionValid() ? CheckCircle : ErrorIcon
    },
    {
      label: HEBREW_LABELS.security.rateLimitOk,
      status: securityStatus.rateLimitStatus === 'ok' ? 'ok' : 
              securityStatus.rateLimitStatus === 'warning' ? 'warning' : 'error',
      icon: securityStatus.rateLimitStatus === 'ok' ? CheckCircle : Warning
    },
    {
      label: HEBREW_LABELS.security.noSuspiciousActivity,
      status: !securityState.suspiciousActivityDetected ? 'ok' : 'error',
      icon: !securityState.suspiciousActivityDetected ? CheckCircle : Warning
    }
  ], [securityState, securityStatus, isSessionValid]);

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          icon={<Shield />}
          label={HEBREW_LABELS.security[overallStatus.level]}
          color={overallStatus.color}
          size="small"
        />
        {showProgress && securityState.rateLimitStatus.isLocked && (
          <LinearProgress 
            sx={{ width: 60, height: 4 }} 
            color={overallStatus.color}
          />
        )}
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader
        avatar={<Shield color={overallStatus.color} />}
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{HEBREW_LABELS.security.status}</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={HEBREW_LABELS.security[overallStatus.level]}
                color={overallStatus.color}
                size="small"
              />
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ direction: 'ltr' }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>
        }
        sx={{ direction: 'rtl', pb: expanded ? 1 : 0 }}
      />
      
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          <List dense>
            {statusItems.map((item, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <item.icon 
                    sx={{ 
                      fontSize: 20,
                      color: item.status === 'ok' ? 'success.main' :
                             item.status === 'warning' ? 'warning.main' : 'error.main'
                    }} 
                  />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{ direction: 'rtl', textAlign: 'right' }}
                />
              </ListItem>
            ))}
          </List>
          
          {showProgress && (
            <Box mt={2}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                רמת אבטחה כללית
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overallStatus.level === 'secure' ? 100 : 
                       overallStatus.level === 'warning' ? 60 : 20}
                color={overallStatus.color}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}

/**
 * Audit Log Viewer Component
 * Displays security audit logs with filtering and search
 */
export function AuditLogViewer({ 
  userId,
  maxEntries = 50,
  showFilters = true,
  autoRefresh = false,
  refreshInterval = 30000
}: AuditLogViewerProps) {
  const [entries, setEntries] = useState<SecurityAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    severity: 'all',
    eventType: 'all',
    dateRange: '24h'
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const loadAuditEntries = useCallback(async () => {
    setLoading(true);
    try {
      // Mock audit entries - in real app, this would fetch from the security audit service
      const mockEntries: SecurityAuditEvent[] = [
        {
          eventType: 'permission_check',
          severity: 'info',
          userId: 'user123',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          details: { action: 'permission_granted', resource: 'student_deletion' }
        },
        {
          eventType: 'verification_attempt',
          severity: 'warning',
          userId: 'user456',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          details: { action: 'verification_failed', verificationStep: 'password' }
        },
        {
          eventType: 'rate_limit_hit',
          severity: 'warning',
          userId: 'user789',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          details: { action: 'rate_limit_exceeded', rateLimitType: 'bulk' }
        }
      ];

      // Apply filters
      let filteredEntries = mockEntries;
      
      if (filters.severity !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.severity === filters.severity);
      }
      
      if (filters.eventType !== 'all') {
        filteredEntries = filteredEntries.filter(entry => entry.eventType === filters.eventType);
      }

      if (userId) {
        filteredEntries = filteredEntries.filter(entry => entry.userId === userId);
      }

      setEntries(filteredEntries.slice(0, maxEntries));
    } catch (error) {
      console.error('Failed to load audit entries:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, maxEntries, filters]);

  useEffect(() => {
    loadAuditEntries();
    
    if (autoRefresh) {
      const interval = setInterval(loadAuditEntries, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadAuditEntries, autoRefresh, refreshInterval]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'permission_check': return <AdminPanelSettings />;
      case 'verification_attempt': return <Security />;
      case 'rate_limit_hit': return <Timer />;
      case 'suspicious_activity': return <Warning />;
      case 'deletion_attempt': return <Delete />;
      case 'security_violation': return <Block />;
      default: return <Info />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(timestamp);
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{HEBREW_LABELS.audit.title}</Typography>
            <Box display="flex" gap={1}>
              {showFilters && (
                <IconButton
                  size="small"
                  onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                >
                  <FilterList />
                </IconButton>
              )}
              <IconButton size="small" onClick={loadAuditEntries} disabled={loading}>
                <Refresh sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Box>
          </Box>
        }
        sx={{ direction: 'rtl' }}
      />

      <Collapse in={showFiltersPanel}>
        <CardContent sx={{ pt: 0, pb: 1 }}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>חומרה</InputLabel>
              <Select
                value={filters.severity}
                label="חומרה"
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              >
                <MenuItem value="all">הכול</MenuItem>
                <MenuItem value="critical">קריטי</MenuItem>
                <MenuItem value="error">שגיאה</MenuItem>
                <MenuItem value="warning">אזהרה</MenuItem>
                <MenuItem value="info">מידע</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>סוג אירוע</InputLabel>
              <Select
                value={filters.eventType}
                label="סוג אירוע"
                onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              >
                <MenuItem value="all">הכול</MenuItem>
                <MenuItem value="permission_check">בדיקת הרשאות</MenuItem>
                <MenuItem value="verification_attempt">ניסיון אימות</MenuItem>
                <MenuItem value="rate_limit_hit">חריגת מגבלה</MenuItem>
                <MenuItem value="suspicious_activity">פעילות חשודה</MenuItem>
                <MenuItem value="deletion_attempt">ניסיון מחיקה</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Collapse>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="right">{HEBREW_LABELS.audit.timestamp}</TableCell>
              <TableCell align="right">{HEBREW_LABELS.audit.user}</TableCell>
              <TableCell align="right">{HEBREW_LABELS.audit.action}</TableCell>
              <TableCell align="right">{HEBREW_LABELS.audit.severity}</TableCell>
              <TableCell align="right">{HEBREW_LABELS.audit.details}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Box display="flex" alignItems="center" justifyContent="center" gap={1} py={2}>
                    <Security sx={{ animation: 'pulse 1s infinite' }} />
                    <Typography>טוען יומן ביקורת...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" py={2}>
                    {HEBREW_LABELS.audit.noEntries}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((entry, index) => (
                  <TableRow key={index} hover>
                    <TableCell align="right">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell align="right">
                      {entry.userId?.substring(0, 8)}...
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" gap={1}>
                        {getEventTypeIcon(entry.eventType)}
                        <Typography variant="body2">
                          {entry.details.action}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={entry.severity}
                        color={getSeverityColor(entry.severity) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption">
                        {entry.details.resource || entry.details.studentId || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={entries.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="שורות בעמוד:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        sx={{ direction: 'rtl' }}
      />
    </Card>
  );
}

/**
 * Suspicious Activity Alert Component
 * Shows alerts for detected suspicious activity
 */
export function SuspiciousActivityAlert({ 
  onDismiss,
  onViewDetails,
  severity = 'warning'
}: SuspiciousActivityAlertProps) {
  const { securityState } = useDeletionSecurity();

  if (!securityState.suspiciousActivityDetected) {
    return null;
  }

  return (
    <Alert
      severity={severity}
      sx={{ 
        direction: 'rtl',
        mb: 2
      }}
      action={
        <Box>
          {onViewDetails && (
            <Button color="inherit" size="small" onClick={onViewDetails}>
              {HEBREW_LABELS.actions.viewDetails}
            </Button>
          )}
          {onDismiss && (
            <Button color="inherit" size="small" onClick={onDismiss}>
              {HEBREW_LABELS.actions.dismiss}
            </Button>
          )}
        </Box>
      }
      icon={<Warning />}
    >
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
        {HEBREW_LABELS.security.suspiciousActivity}
      </Typography>
      <Typography variant="body2">
        זוהו פעילויות חשודות בחשבון שלך. בדוק את היומן לפרטים נוספים.
      </Typography>
    </Alert>
  );
}

/**
 * Emergency Lock Button Component
 * Admin button to immediately lock suspicious accounts
 */
export function EmergencyLockButton({ 
  onLock,
  requiresConfirmation = true,
  disabled = false
}: EmergencyLockButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { lockUserAccount } = useDeletionSecurity();

  const handleEmergencyLock = async () => {
    if (requiresConfirmation) {
      setShowConfirmation(true);
    } else {
      await handleConfirmedLock();
    }
  };

  const handleConfirmedLock = async () => {
    try {
      await lockUserAccount('Emergency lock activated by admin');
      onLock?.();
      setShowConfirmation(false);
    } catch (error) {
      console.error('Emergency lock failed:', error);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="error"
        size="small"
        startIcon={<Emergency />}
        onClick={handleEmergencyLock}
        disabled={disabled}
        sx={{ direction: 'ltr' }}
      >
        {HEBREW_LABELS.actions.emergency}
      </Button>

      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ direction: 'rtl' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Emergency color="error" />
            <Typography variant="h6">נעילת חירום</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ direction: 'rtl' }}>
          <Typography variant="body1" gutterBottom>
            האם אתה בטוח שברצונך לנעול את החשבון מיידית?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            פעולה זו תנעל את החשבון ותמנע גישה מיידית. ניתן לבטל את הנעילה מאוחר יותר.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ direction: 'ltr' }}>
          <Button onClick={() => setShowConfirmation(false)}>
            {HEBREW_LABELS.actions.cancel}
          </Button>
          <Button 
            onClick={handleConfirmedLock}
            color="error"
            variant="contained"
            startIcon={<Emergency />}
          >
            {HEBREW_LABELS.actions.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default {
  PermissionIndicator,
  SecurityStatusBar,
  AuditLogViewer,
  SuspiciousActivityAlert,
  EmergencyLockButton
};