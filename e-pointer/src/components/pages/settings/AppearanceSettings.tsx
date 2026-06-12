import { Form, Select, Card } from 'antd';

import { useSettingsStore } from '../../../stores/settingsStore';

const fontSizeOptions = [
  {
    value: 'small',
    label: '小'
  },
  {
    value: 'medium',
    label: '中'
  },
  {
    value: 'large',
    label: '大'
  }
];
export default function AppearanceSettings() {
  const { setFontSize } = useSettingsStore();
  return (
    <Card title="外观设置">
      <Form.Item name="fontSize" label="字体大小">
        <Select options={fontSizeOptions} onChange={(value) => setFontSize(value)} />
      </Form.Item>
    </Card>
  );
}
