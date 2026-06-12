import Settings from './Settings';

interface SettingsPageProps {
  defaultActiveTab?: string;
}
export default function SettingsPage({ defaultActiveTab = 'appearance' }: SettingsPageProps) {
  return (
    <div className="settings-page" style={{ height: '100%', padding: '4px' }}>
      <Settings open={true} defaultActiveTab={defaultActiveTab} />
    </div>
  );
}
