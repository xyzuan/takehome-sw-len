import { Map } from '@/components/ui/map'

export default function App() {
  return (
    <div className="w-screen h-screen">
      <Map center={[106.8456, -6.2088]} zoom={11} />
    </div>
  )
}
