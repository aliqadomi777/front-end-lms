import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useUpdateUserRole, useDeleteUser } from '@/hooks/useApi';

const UserManagementDialog = ({ user, isOpen, onClose, action }) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || '');
  const updateUserRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const handleRoleUpdate = async () => {
    if (!selectedRole || selectedRole === user.role) {
      onClose();
      return;
    }

    try {
      await updateUserRole.mutateAsync({
        userId: user.id,
        role: selectedRole
      });
      onClose();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleUserDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        {action === 'edit' ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Update the role for {user.name} ({user.email})
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Role</label>
                <Badge variant="outline">{user.role}</Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin" disabled>
                      Admin (Cannot be assigned)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleRoleUpdate}
                disabled={updateUserRole.isPending || !selectedRole || selectedRole === user.role}
              >
                {updateUserRole.isPending ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {user.name} ({user.email})? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-destructive/10 p-4 rounded-lg">
                <p className="text-sm text-destructive">
                  <strong>Warning:</strong> This will permanently delete the user account and all associated data.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleUserDelete}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;