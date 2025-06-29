import React, { useState, useEffect } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

const USERS_PER_PAGE = 20;

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  phone: string;
  email_verified: boolean;
  phone_verified: boolean;
  membership_level: string;
  total_invested: number;
  crypto_connected: boolean;
  bank_connected: boolean;
  created_at: string;
  last_login: string;
  connected_wallets_count: number;
}

interface UserListResponse {
  users: AdminUser[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export const AdminUsersScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<UserListResponse['pagination'] | null>(null);
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);
  const { user } = useApp();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterVerified]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      if (!user?.token) {
        console.error('No authentication token');
        return;
      }

      const response = await apiService.getAdminUsers(
        user.token,
        {
          page: currentPage,
          limit: USERS_PER_PAGE,
          search: searchQuery.trim() || undefined,
          filter_verified: filterVerified !== null ? filterVerified : undefined
        }
      );
      
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleUserClick = (userId: string) => {
    onNavigate?.('admin-user-details', { userId });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const getMembershipIcon = (level: string) => {
    switch (level) {
      case 'basic': return '🌱';
      case 'club': return '🥉';
      case 'premium': return '🥈';
      case 'vip': return '🥇';
      case 'elite': return '💎';
      default: return '👤';
    }
  };

  const getVerificationStatus = (emailVerified: boolean, phoneVerified: boolean) => {
    if (emailVerified && phoneVerified) return { icon: '✅', text: 'Verified', color: 'text-green-400' };
    if (emailVerified || phoneVerified) return { icon: '⚠️', text: 'Partial', color: 'text-yellow-400' };
    return { icon: '❌', text: 'Unverified', color: 'text-red-400' };
  };

  if (loading && users.length === 0) {
    return <FullScreenLoader text="Loading users..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader 
        title="👥 User Management" 
        onBack={onBack}
        action={
          <Button 
            onClick={fetchUsers} 
            size="sm" 
            variant="outline"
            disabled={loading}
          >
            {loading ? '↻' : '⟲'}
          </Button>
        }
      />

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, name, or user ID..."
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>

          <div className="flex gap-2 text-sm">
            <Button
              onClick={() => setFilterVerified(null)}
              variant={filterVerified === null ? "primary" : "outline"}
              size="sm"
            >
              All Users
            </Button>
            <Button
              onClick={() => setFilterVerified(true)}
              variant={filterVerified === true ? "primary" : "outline"}
              size="sm"
            >
              Verified Only
            </Button>
            <Button
              onClick={() => setFilterVerified(false)}
              variant={filterVerified === false ? "primary" : "outline"}
              size="sm"
            >
              Unverified Only
            </Button>
          </div>
        </div>
      </Card>

      {/* User List */}
      <div className="space-y-4 mb-6">
        {users.map((adminUser) => {
          const verification = getVerificationStatus(adminUser.email_verified, adminUser.phone_verified);
          
          return (
            <Card 
              key={adminUser.id} 
              className="cursor-pointer hover:bg-gray-800/50 transition-colors"
              onClick={() => handleUserClick(adminUser.user_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getMembershipIcon(adminUser.membership_level)}</span>
                    <div>
                      <div className="font-semibold text-white">
                        {adminUser.name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {adminUser.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>
                      <span className="text-gray-500">Verification:</span>
                      <span className={`ml-1 ${verification.color}`}>
                        {verification.icon} {verification.text}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Invested:</span>
                      <span className="ml-1 text-green-400 font-medium">
                        {formatCurrency(adminUser.total_invested)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Wallets:</span>
                      <span className="ml-1 text-white">
                        {adminUser.connected_wallets_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Joined:</span>
                      <span className="ml-1 text-white">
                        {formatDate(adminUser.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-sm font-medium capitalize text-purple-400">
                    {adminUser.membership_level}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {adminUser.crypto_connected && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                        CRYPTO
                      </span>
                    )}
                    {adminUser.bank_connected && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        BANK
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Page {pagination.current_page} of {pagination.total_pages} 
              ({pagination.total_count} total users)
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= pagination.total_pages || loading}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {users.length === 0 && !loading && (
        <Card className="text-center">
          <div className="text-gray-400 mb-4">👥</div>
          <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
          <p className="text-gray-400">
            {searchQuery ? 'Try adjusting your search criteria' : 'No users in the system yet'}
          </p>
        </Card>
      )}
    </div>
  );
};