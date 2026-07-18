import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, selectShopId, selectToken } from '../store/authSlice';
import * as queueApi from '../api/queue';

// Live queue data + staff actions for the current user's shop.
//
// - Polls `/queue/status` every few seconds (refetchInterval) so the board stays
//   fresh. Mutations invalidate the query so the acting user sees changes at once.
// - The backend also emits Socket.io `queue:update` events; swapping polling for
//   a socket subscription is a drop-in upgrade later (see backend QueueGateway).
export function useQueue() {
  const token = useSelector(selectToken);
  const shopId = useSelector(selectShopId);
  const qc = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const queryKey = ['queue', shopId];
  const invalidate = () => qc.invalidateQueries({ queryKey });

  // A stale/expired token -> log out and bounce to /login.
  const onAuthError = (err) => {
    if (err?.status === 401) {
      dispatch(logout());
      navigate('/login');
    }
  };

  const statusQuery = useQuery({
    queryKey,
    queryFn: () => queueApi.getQueueStatus(shopId, token),
    enabled: !!shopId && !!token,
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });

  // react-query v5 removed onError from useQuery — handle it here instead.
  useEffect(() => {
    if (statusQuery.error) onAuthError(statusQuery.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusQuery.error]);

  const next = useMutation({
    mutationFn: () => queueApi.advanceQueue(shopId, token),
    onSuccess: invalidate,
    onError: onAuthError,
  });

  const walkin = useMutation({
    mutationFn: (data) => queueApi.addWalkin({ shopId, ...data }, token),
    onSuccess: invalidate,
    onError: onAuthError,
  });

  const skip = useMutation({
    mutationFn: (entryId) => queueApi.skipEntry(entryId, token),
    onSuccess: invalidate,
    onError: onAuthError,
  });

  const noShow = useMutation({
    mutationFn: (entryId) => queueApi.noShowEntry(entryId, token),
    onSuccess: invalidate,
    onError: onAuthError,
  });

  return {
    status: statusQuery.data,
    isPending: statusQuery.isPending,
    isError: statusQuery.isError,
    error: statusQuery.error,
    refetch: statusQuery.refetch,
    next,
    walkin,
    skip,
    noShow,
  };
}
