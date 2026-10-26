import React from 'react';
import { FarmerProfile } from '../../types';
import { User, MapPin } from 'lucide-react';
import { Badge } from '../shared/Badge';
import { useLanguage } from '../../hooks/useLanguage';

export const ProfileCard: React.FC<{ profile: FarmerProfile }> = ({ profile }) => {
  const { t } = useLanguage();

  return (
    <div className="h-full bg-gradient-to-br from-forest-900 to-forest-950 text-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-800 text-leaf-300 flex items-center justify-center font-bold text-xl border border-forest-700">
            <User size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-white">
                {profile.is_demo_profile ? t.ui.demoFarmerName : profile.name}
              </h2>
              {profile.is_demo_profile && (
                <Badge variant="amber" className="bg-amber-400/20 text-amber-200 border-amber-300/30 text-[10px]">
                  {t.ui.demoAccount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-forest-200 mt-0.5">
              <MapPin size={13} className="text-leaf-400" />
              <span>{profile.location}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-forest-800/80 flex items-center justify-between text-xs text-forest-100">
        <div>
          <span className="text-forest-300 block text-[11px]">{t.ui.stateRegion}</span>
          <span className="font-medium text-white">
            {profile.state.toLowerCase() === 'maharashtra' ? t.ui.maharashtra : profile.state}
          </span>
        </div>
        <div className="text-right">
          <span className="text-forest-300 block text-[11px]">{t.ui.accountType}</span>
          <span className="font-medium text-leaf-300">{t.ui.landRecordVerified}</span>
        </div>
      </div>
    </div>
  );
};
