import { DataTypes } from 'sequelize';
import sequelize from '../../config/sequelize.js';

const FeatureProperty = sequelize.define('FeatureProperty', {
  property_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true,
  },
  feature_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true,
  }
}, {
  tableName: 'feature_property',
  timestamps: false
});

export default FeatureProperty;
