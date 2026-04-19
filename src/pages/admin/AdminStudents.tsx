import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { api, Student } from '@/services/api';
import { Search, Plus, Trash2, Edit, Users, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
    avatar: 'https://i.pravatar.cc/150?img=2',
    phone: '',
    telegram: ''
  });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'delete' | 'edit'; id?: number; name?: string; student?: Student }>({ open: false, type: 'delete' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents();
      console.log('📥 Fetched students from API:', data.length, 'students');
      setStudents(data);
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      toast.error('O\'quvchilar yuklanishida xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || 
                         s.email?.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [students, search]);

  const handleCreate = async () => {
    if (!newStudent.name || !newStudent.email || (!editingId && !newStudent.password)) {
      toast.error('Majburiy maydonlarni to\'ldiring');
      return;
    }
    try {
      if (editingId) {
        console.log('✏️ Updating student:', editingId);
        await api.updateStudent(editingId, newStudent);
        toast.success(`O'quvchi o'zgartirildi: "${newStudent.name}"`);
      } else {
        console.log('➕ Creating new student:', newStudent.name, 'Email:', newStudent.email);
        const result = await api.createStudent(newStudent);
        console.log('✅ Student created with ID:', result.id);
        toast.success(`O'quvchi qo'shildi: "${newStudent.name}"`);
      }
    } catch (error: any) {
      console.error('❌ Error in handleCreate:', error);
      const errorMsg = error.message || 'Noma\'lum xatolik';
      if (errorMsg.includes('duplicate key')) {
        toast.error('Bu email allaqachon ishlatilgan!');
      } else if (errorMsg.includes('404')) {
        toast.error('Server javob bermadi');
      } else {
        toast.error(`Xatolik: ${errorMsg}`);
      }
      return;
    }
    
    // Close modal and reset form
    setShowModal(false);
    setEditingId(null);
    setNewStudent({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), phone: '', telegram: '' });
    
    // Refresh student list
    await fetchStudents();
    console.log('🔄 Refreshed student list after create');
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteStudent(id);
      toast.success('O\'quvchi o\'chirildi');
      await fetchStudents();
    } catch (error: any) {
      console.error('❌ Delete error:', error);
      toast.error(`Xatolik: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    try {
      await Promise.all(Array.from(selectedStudents).map(id => api.deleteStudent(id)));
      toast.success(`${selectedStudents.size} ta o'quvchi o'chirildi`);
      setSelectedStudents(new Set());
      await fetchStudents();
    } catch (error) {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleEdit = (student: Student) => {
    setConfirmModal({ open: true, type: 'edit', id: student.id || undefined, name: student.name, student });
  };

  const doEdit = (student: Student) => {
    setNewStudent({
      name: student.name,
      email: student.email,
      password: '',
      avatar: student.avatar || '',
      phone: student.phone || '',
      telegram: student.telegram || ''
    });
    setEditingId(student.id || null);
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Yuklanmoqda...</div>;

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      
      {/* PREMIUM HEADER */}
      <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 shadow-2xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">O'quvchilar Boshqaruvi</h1>
              <p className="text-cyan-300/80 text-lg font-medium">Barcha o'quvchilarni boshqaring va monitor qiling</p>
            </div>
            <Users className="w-24 h-24 text-cyan-400 opacity-80" />
          </div>
        </div>
      </motion.div>

      {/* TOOLBAR */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 flex gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
            <input
              type="text"
              placeholder="O'quvchi qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {selectedStudents.size > 0 && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkDelete}
              className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-black text-sm hover:bg-red-500/30 transition-all"
            >
              O'chirish ({selectedStudents.size})
            </motion.button>
          )}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingId(null);
              setNewStudent({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), phone: '', telegram: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-black text-sm hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Yangi O'quvchi
          </motion.button>
        </div>
      </motion.div>

      {/* STUDENTS GRID */}
      {filtered.length === 0 ? (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg font-black">O'quvchi topilmadi</p>
        </motion.div>
      ) : (
        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student, idx) => (
            <motion.div
              key={student.id}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={student.avatar || 'https://i.pravatar.cc/150'}
                  alt={student.name}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-slate-700/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-black text-sm">{student.name}</p>
                      <p className="text-slate-400 text-xs">{student.email}</p>
                    </div>
                    <motion.input
                      type="checkbox"
                      checked={selectedStudents.has(student.id as number)}
                      onChange={(e) => {
                        const newSet = new Set(selectedStudents);
                        if (e.target.checked) {
                          newSet.add(student.id as number);
                        } else {
                          newSet.delete(student.id as number);
                        }
                        setSelectedStudents(newSet);
                      }}
                      className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 text-xs text-slate-400">
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.telegram && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <span>{student.telegram}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEdit(student)}
                  className="flex-1 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-black text-xs uppercase transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  O'zgartirish
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmModal({ open: true, type: 'delete', id: student.id as number, name: student.name })}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-black text-xs uppercase transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  O'chirish
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* MODAL */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setShowModal(false);
            setEditingId(null);
            setNewStudent({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), phone: '', telegram: '' });
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-cyan-500/30 shadow-2xl"
          >
            <h2 className="text-2xl font-black text-white mb-6">
              {editingId ? 'O\'quvchini O\'zgartirish' : 'Yangi O\'quvchi Qo\'shish'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">O'quvchi Nomi *</label>
                <input
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="Ism va Familiya"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Email *</label>
                <input
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="email@example.com"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Parol *</label>
                  <input
                    type="password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Telefon</label>
                <input
                  value={newStudent.phone || ''}
                  onChange={(e) => setNewStudent(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="+998 90 123 45 67"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-2 block">Telegram</label>
                <input
                  value={newStudent.telegram || ''}
                  onChange={(e) => setNewStudent(p => ({ ...p, telegram: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-cyan-500/30 text-white focus:outline-none focus:border-cyan-400/50"
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setNewStudent({ name: '', email: '', password: '', avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70), phone: '', telegram: '' });
                }}
                className="flex-1 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 text-white font-black uppercase transition-colors"
              >
                Bekor Qilish
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreate}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-black uppercase hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
              >
                {editingId ? 'O\'zgartirish' : 'Qo\'shish'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={confirmModal.open}
        type={confirmModal.type}
        title={confirmModal.name}
        onCancel={() => setConfirmModal(p => ({ ...p, open: false }))}
        onConfirm={() => {
          if (confirmModal.type === 'delete' && confirmModal.id) {
            handleDelete(confirmModal.id);
          } else if (confirmModal.type === 'edit' && confirmModal.student) {
            doEdit(confirmModal.student);
          }
          setConfirmModal(p => ({ ...p, open: false }));
        }}
      />

    </motion.div>
  );
}
