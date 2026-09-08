import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography } from '@mui/material';
import { Scissors } from 'lucide-react';
import BackButton from '../components/BackButton';
import DashboardShell from '../components/DashboardShell';
import PageTransition from '../components/PageTransition';
import QueueBoard from '../components/QueueBoard';
import { getShop } from '../api/shops';
import { selectToken } from '../store/authSlice';
import { getShopType } from '../config/shopTypes';
import ShopOpenToggle from '../components/ShopOpenToggle';

// A shop owner's live queue for ONE of their shops, reached from either the
// single-shop dashboard or a card in "My Shops". The board itself is the shared
// QueueBoard, pointed at this shop via its `shopId` prop; owners get the
// no-show action. Barbers keep their own single-shop board (StaffDashboard).
export default function ShopQueue() {
  const { shopId } = useParams();
  const token = useSelector(selectToken);
  const navigate = useNavigate();

  const shopQuery = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getShop(shopId, token),
    enabled: !!token && !!shopId,
  });

  const shop = shopQuery.data;
  const meta = shop ? getShopType(shop.type) : null;
  const TypeIcon = meta?.icon ?? Scissors;

  return (
    <PageTransition>
      <DashboardShell roleKey="SHOP_OWNER">
        <BackButton label="Back" onClick={() => navigate(-1)} />

        {shop && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}
          >
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 52,
                height: 52,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'rgba(200,155,60,0.16)',
                border: '1px solid rgba(200,155,60,0.4)',
                color: 'primary.main',
              }}
            >
              <TypeIcon size={24} aria-hidden="true" />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography className="font-display" sx={{ fontSize: 30, lineHeight: 1, color: '#F3ECDF' }} noWrap>
                {shop.name}
              </Typography>
              <Typography className="font-signage" sx={{ mt: 0.25, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'text.secondary' }}>
                Live Queue
              </Typography>
            </Box>
            <ShopOpenToggle shop={shop} size="sm" />
          </Box>
        )}

        {shopQuery.isError ? (
          <Typography sx={{ color: 'error.main', py: 2 }}>
            Couldn’t load this shop: {shopQuery.error?.message ?? 'unknown error'}
          </Typography>
        ) : (
          <QueueBoard shopId={shopId} canNoShow />
        )}
      </DashboardShell>
    </PageTransition>
  );
}
