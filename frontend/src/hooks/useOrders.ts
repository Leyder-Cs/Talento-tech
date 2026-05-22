import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'my'],
    queryFn: () => ordersService.findMy(),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      items: { productId: string; quantity: number }[];
    }) => ordersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAllOrders(page?: number, limit?: number, status?: string, paymentStatus?: string, returnStatus?: string) {
  return useQuery({
    queryKey: ['orders', 'all', { page, limit, status, paymentStatus, returnStatus }],
    queryFn: () => ordersService.findAll(page, limit, status, paymentStatus, returnStatus),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, paymentStatus, items }: { id: string; status?: string; paymentStatus?: string; items?: { productId: string; quantity: number }[] }) =>
      ordersService.updateStatus(id, { status, paymentStatus, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, returnStatus, returnReason }: { id: string; returnStatus: string; returnReason?: string }) =>
      ordersService.updateReturn(id, { returnStatus, returnReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersService.cancelAsUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRequestReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ordersService.requestReturn(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
