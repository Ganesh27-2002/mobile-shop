import { Router } from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateRequest } from '../validators/authValidator.js';
import { addressSchema, updateAddressSchema } from '../validators/addressValidator.js';

const router = Router();

// All address endpoints require authentication
router.use(authMiddleware);

router.get('/', getAddresses);
router.post('/', validateRequest(addressSchema), createAddress);
router.put('/:id', validateRequest(updateAddressSchema), updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;
