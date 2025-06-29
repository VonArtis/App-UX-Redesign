import { useState, useCallback } from 'react';
import type { User, MembershipStatus } from '../types';
import { apiService } from '../services/api';

export const useMembership = (user: User | null) => {
  const [membershipStatus, setMembershipStatus] = useState<any>(null);

  const fetchMembershipStatus = async () => {
    console.log('fetchMembershipStatus called');
    console.log('User provided to useMembership:', user);
    console.log('User token:', user?.token);
    
    if (!user?.token) {
      console.log('No token available, cannot fetch membership status');
      return;
    }

    try {
      console.log('Attempting to fetch membership status...');
      const status = await apiService.getMembershipStatus(user.token);
      console.log('Membership status fetched:', status);
      setMembershipStatus(status);
    } catch (error) {
      console.error('Error fetching membership status:', error);
    }
  };

  return {
    membershipStatus,
    fetchMembershipStatus
  };
};