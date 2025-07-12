import { DataTypes } from 'sequelize';
import sequelize from '../../config/sequelize.js';

const PropertyFeature = sequelize.define('PropertyFeature', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100)
  },
  icon: {
    type: DataTypes.STRING(100)
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'property_features',
  timestamps: true,
  underscored: true
});

PropertyFeature.associate = (models) => {
  PropertyFeature.belongsToMany(models.Property, {
    through: models.FeatureProperty,
    foreignKey: 'feature_id',
    otherKey: 'property_id',
    as: 'properties'
  });
};

export default PropertyFeature;
