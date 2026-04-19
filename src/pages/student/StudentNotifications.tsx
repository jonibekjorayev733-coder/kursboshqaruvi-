import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { api, Notification } from '@/services/api';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Trash2, Check, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<number | null>(null);

  const currentStudentId = localStorage.getItem('user_id');

  useEffect(() => {
    fetchNotifications();
    fetchAssignments();
  }, []);

  const fetchNotifications = async () => {
    try {
      const userId = parseInt(currentStudentId || '0');
      const allNotifications = await api.getNotifications(userId);
      // Ensure notifications is an array
      if (Array.isArray(allNotifications)) {
        setNotifications(allNotifications);
      } else {
        console.warn('Notifications response is not an array:', allNotifications);
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const allAssignments = await api.getAssignments();
      // Ensure allAssignments is an array before filtering
      if (!Array.isArray(allAssignments)) {
        console.warn('Assignments response is not an array:', allAssignments);
        setAssignments([]);
        return;
      }
      const studentAssignments = allAssignments.filter(
        a => a.student_id?.toString() === currentStudentId
      );
      setAssignments(studentAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setAssignments([]);
    }
  };

  const handleMarkRead = async (notificationId: number) => {
    try {
      await api.markNotificationRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleSubmitAssignment = async (assignmentId: number) => {
    setSubmittingAssignmentId(assignmentId);
    try {
      await api.submitAssignment(assignmentId);
      // Refresh assignments after submission
      await fetchAssignments();
      // Show success notification
      alert('Vazifa qabul qilindi!');
    } catch (err) {
      console.error('Error submitting assignment:', err);
      alert('Xato: Vazifani qabul qila olmadik');
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  const handleDelete = (notificationId: number) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_created':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'assignment_updated':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'assignment_deleted':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'assignment_submitted':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'payment_paid':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'payment_received':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="p-10 text-center opacity-50">Yuklanmoqda...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader 
        title="Bildirishnomalar" 
        subtitle="Sizning barcha xabarlari va vazifa yangiliqlari"
      />

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          Barchasi ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          className="flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          O'qilmagan ({notifications.filter(n => !n.read).length})
        </Button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-dashed">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            {filter === 'unread' ? 'Yangi xabar yo\'q' : 'Bildirishnomalar yo\'q'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {filter === 'unread'
              ? 'Siz barcha xabarlarga ko\'z yuborganingiz!'
              : 'O\'qituvchi tomonidan yangi vazifa berilganda, bu yerda xabar olasiz'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-5 transition-all cursor-pointer ${
                  notification.read
                    ? 'bg-white/50 opacity-75 hover:opacity-100'
                    : notification.type === 'payment_paid' || notification.type === 'payment_received'
                    ? 'bg-green-50 border-green-300 border-2 shadow-md'
                    : 'bg-blue-50 border-blue-200 border-2 shadow-md'
                }`}
                onClick={() => !notification.read && handleMarkRead(notification.id!)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {notification.read ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      getNotificationIcon(notification.type)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {notification.created_at
                        ? new Date(notification.created_at).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Yangilandi'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-center">
                    {notification.type === 'assignment_created' && notification.assignment_id && (
                      <>
                        {(() => {
                          const assignment = assignments.find(a => a.id === notification.assignment_id);
                          if (assignment && !assignment.submitted) {
                            return (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubmitAssignment(assignment.id);
                                }}
                                disabled={submittingAssignmentId === assignment.id}
                              >
                                {submittingAssignmentId === assignment.id ? (
                                  <>
                                    <span className="animate-spin">⏳</span>
                                    Jarayonda...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Qabul qilish
                                  </>
                                )}
                              </Button>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id!);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
