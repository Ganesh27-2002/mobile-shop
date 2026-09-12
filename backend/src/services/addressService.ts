import { Address } from '../models/index.js';
import { sequelize } from '../config/database.js';
import { AppError } from './authService.js';

export interface AddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

/**
 * Retrieves all saved addresses for an authenticated user.
 */
export const getAddresses = async (userId: string): Promise<Address[]> => {
  return await Address.findAll({
    where: { userId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
};

/**
 * Creates a new address for the user.
 * Automatically makes it default if it's the user's first address or if isDefault is true.
 */
export const createAddress = async (
  userId: string,
  data: AddressInput
): Promise<Address> => {
  return await sequelize.transaction(async (t) => {
    const addressCount = await Address.count({
      where: { userId },
      transaction: t,
    });

    const isFirstAddress = addressCount === 0;
    const shouldBeDefault = isFirstAddress || !!data.isDefault;

    if (shouldBeDefault && addressCount > 0) {
      await Address.update(
        { isDefault: false },
        {
          where: { userId },
          transaction: t,
        }
      );
    }

    const newAddress = await Address.create(
      {
        userId,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        addressLine1: data.addressLine1.trim(),
        addressLine2: data.addressLine2 ? data.addressLine2.trim() : null,
        city: data.city.trim(),
        state: data.state.trim(),
        postalCode: data.postalCode.trim(),
        country: data.country ? data.country.trim() : 'India',
        isDefault: shouldBeDefault,
      },
      { transaction: t }
    );

    return newAddress;
  });
};

/**
 * Updates an existing address belonging to the user.
 */
export const updateAddress = async (
  userId: string,
  addressId: string,
  data: Partial<AddressInput>
): Promise<Address> => {
  const address = await Address.findByPk(addressId);

  if (!address || address.userId !== userId) {
    throw new AppError('Address not found', 404);
  }

  return await sequelize.transaction(async (t) => {
    if (data.isDefault === true) {
      await Address.update(
        { isDefault: false },
        {
          where: { userId },
          transaction: t,
        }
      );
    }

    if (data.fullName !== undefined) address.fullName = data.fullName.trim();
    if (data.phone !== undefined) address.phone = data.phone.trim();
    if (data.addressLine1 !== undefined) address.addressLine1 = data.addressLine1.trim();
    if (data.addressLine2 !== undefined) {
      address.addressLine2 = data.addressLine2 ? data.addressLine2.trim() : null;
    }
    if (data.city !== undefined) address.city = data.city.trim();
    if (data.state !== undefined) address.state = data.state.trim();
    if (data.postalCode !== undefined) address.postalCode = data.postalCode.trim();
    if (data.country !== undefined) address.country = data.country ? data.country.trim() : 'India';
    if (data.isDefault !== undefined) address.isDefault = data.isDefault;

    await address.save({ transaction: t });
    return address;
  });
};

/**
 * Deletes an address. If deleting the default address, selects another remaining address as default.
 */
export const deleteAddress = async (
  userId: string,
  addressId: string
): Promise<void> => {
  const address = await Address.findByPk(addressId);

  if (!address || address.userId !== userId) {
    throw new AppError('Address not found', 404);
  }

  const wasDefault = address.isDefault;

  await sequelize.transaction(async (t) => {
    await address.destroy({ transaction: t });

    if (wasDefault) {
      const remainingAddress = await Address.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']],
        transaction: t,
      });

      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save({ transaction: t });
      }
    }
  });
};

/**
 * Sets a specific address as the user's default address.
 */
export const setDefaultAddress = async (
  userId: string,
  addressId: string
): Promise<Address> => {
  const address = await Address.findByPk(addressId);

  if (!address || address.userId !== userId) {
    throw new AppError('Address not found', 404);
  }

  return await sequelize.transaction(async (t) => {
    await Address.update(
      { isDefault: false },
      {
        where: { userId },
        transaction: t,
      }
    );

    address.isDefault = true;
    await address.save({ transaction: t });
    return address;
  });
};
