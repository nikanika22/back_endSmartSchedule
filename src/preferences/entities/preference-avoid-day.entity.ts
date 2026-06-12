import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Preference } from './preference.entity';

@Entity('preference_avoid_days')
export class PreferenceAvoidDay {
  @PrimaryColumn({ name: 'pref_id', type: 'int' })
  pref_id: number;

  @PrimaryColumn({ name: 'day_of_week', type: 'smallint' })
  day_of_week: number;

  @ManyToOne(() => Preference, (preference) => preference.avoid_days, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pref_id' })
  preference: Preference;
}
