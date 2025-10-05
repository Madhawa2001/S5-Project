import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/ui/Toast';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; userId: string | null }>({
    isOpen: false,
    userId: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }

  async function approveUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          approval_status: 'approved',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      showToast('success', 'User approved successfully');
      await loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      showToast('error', 'Failed to approve user');
    }
  }

  async function rejectUser() {
    if (!rejectModal.userId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          approval_status: 'rejected',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', rejectModal.userId);

      if (error) throw error;

      showToast('success', 'User rejected');
      setRejectModal({ isOpen: false, userId: null });
      setRejectReason('');
      await loadUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      showToast('error', 'Failed to reject user');
    }
  }

  const pendingUsers = users.filter((u) => u.approval_status === 'pending');
  const approvedUsers = users.filter((u) => u.approval_status === 'approved');
  const rejectedUsers = users.filter((u) => u.approval_status === 'rejected');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Loading users..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Review and manage user accounts</p>
      </div>

      {pendingUsers.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Approvals ({pendingUsers.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Credentials</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Registered</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 bg-amber-50 hover:bg-amber-100">
                    <td className="py-3 px-4 text-sm text-gray-900">{user.full_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="role" role={user.role}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {user.professional_credentials}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => approveUser(user.id)}
                        icon={<Check className="w-4 h-4" />}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setRejectModal({ isOpen: true, userId: user.id })}
                        icon={<X className="w-4 h-4" />}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Approved Users ({approvedUsers.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Approved</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{user.full_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant="role" role={user.role}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {rejectedUsers.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Rejected Users ({rejectedUsers.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {rejectedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{user.full_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="role" role={user.role}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, userId: null })}
        title="Reject User"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to reject this user? You can optionally provide a reason.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 min-h-[100px]"
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setRejectModal({ isOpen: false, userId: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={rejectUser}>
              Reject User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
