import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, Course, Student } from '@/services/api';
import { X, Plus, MessageCircle, Edit, Trash2, Home, Check, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export default function CourseDetailModal({ isOpen, onClose, course }: CourseDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskType, setTaskType] = useState<'course' | 'student'>('course');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const teacherId = localStorage.getItem('user_id');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, course.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch assignments for this course
      const courseAssignments = await api.getAssignments(course.id);
      setAssignments(courseAssignments);

      // Fetch course enrollments to get students
      const allStudents = await api.getStudents();
      // In a real app, you'd filter by enrollment, but for now just show all
      setCourseStudents(allStudents);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (confirm('Siz bu vazifani o\'chirmoqchi ekaniga ishonchingiz komilmi?')) {
      try {
        await api.deleteAssignment(assignmentId);
        setAssignments(assignments.filter(a => a.id !== assignmentId));
      } catch (err) {
        console.error('Error deleting assignment:', err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
          <DialogDescription>{course.description}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Umumiy ma'lumot</TabsTrigger>
            <TabsTrigger value="assignments">Vazifalar ({assignments.length})</TabsTrigger>
            <TabsTrigger value="students">O'quvchilar ({courseStudents.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Mavzu</label>
                <p className="text-lg font-semibold">{course.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Darajasi</label>
                <p className="text-lg font-semibold">{course.level}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Davomiyligi</label>
                <p className="text-lg font-semibold">{course.duration}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Narxi</label>
                <p className="text-lg font-semibold">${course.price}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Tavsifi</label>
              <p className="mt-2 text-gray-700">{course.description}</p>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setTaskType('course');
                  setShowTaskModal(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Kurs vazifasi qo'sh
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTaskType('student');
                  setShowTaskModal(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Talaba vazifasi qo'sh
              </Button>
            </div>

            {loading ? (
              <div>Yuklanmoqda...</div>
            ) : assignments.length === 0 ? (
              <Card className="p-8 text-center bg-gray-50 border-dashed">
                <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Hozircha hech qanday vazifa yo'q</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{assignment.title}</h4>
                          {assignment.student_id && (
                            <>
                              {assignment.submitted ? (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50">
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600">Topshirildi</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50">
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600">Topshirilmadi</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Yaratilgan: {new Date(assignment.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                        {assignment.student_id && (
                          <p className="text-xs text-blue-600 mt-1">📌 Talabaga tayinlangan</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Task Modal */}
            {showTaskModal && (
              <AddTaskModal
                courseId={course.id as number}
                taskType={taskType}
                students={courseStudents}
                onClose={() => {
                  setShowTaskModal(false);
                  setSelectedStudent(null);
                  fetchData();
                }}
              />
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            {courseStudents.length === 0 ? (
              <Card className="p-8 text-center bg-gray-50 border-dashed">
                <p className="text-gray-600">Bu kursga hech qanday talaba biriktirilmagan</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {courseStudents.map((student) => (
                  <Card key={student.id} className="p-4 flex items-center gap-3">
                    <img
                      src={student.avatar || 'https://i.pravatar.cc/150'}
                      alt={student.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface AddTaskModalProps {
  courseId: number;
  taskType: 'course' | 'student';
  students: Student[];
  onClose: () => void;
}

function AddTaskModal({ courseId, taskType, students, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const teacherId = parseInt(localStorage.getItem('user_id') || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    if (taskType === 'student' && !selectedStudent) {
      alert('Iltimos, talabani tanlang');
      return;
    }

    setLoading(true);
    try {
      const assignmentData = {
        title,
        description,
        course_id: courseId,
        teacher_id: teacherId,
        student_id: taskType === 'student' ? selectedStudent : null,
      };

      await api.createAssignment(assignmentData);
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating assignment:', err);
      alert('Vazifa yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="font-semibold text-lg text-center">
              {taskType === 'course' ? 'Kurs vazifasi' : 'Talaba vazifasi'} muvaffaqiyatli yaratildi!
            </h3>
            <p className="text-gray-600 text-center mt-2 text-sm">
              {taskType === 'student' 
                ? 'Talaba bildirishnomalar orqali xabardi oladi' 
                : 'Barcha talabalar bildirishnomalar orqali xabardi oladi'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {taskType === 'course' ? 'Kurs vazifasi qo\'sh' : 'Talaba vazifasi qo\'sh'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {taskType === 'student' && (
            <div>
              <label className="block text-sm font-medium mb-2">Talabani tanlang</label>
              <select
                value={selectedStudent || ''}
                onChange={(e) => setSelectedStudent(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">-- Talabani tanlang --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Vazifa mavzusi</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vazifa mavzusini kiriting"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Vazifa tavsifi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vazifa tavsifini kiriting"
              rows={4}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Bekor qilish
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saqlanyotgan...' : 'Saqlash va yuborish'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
