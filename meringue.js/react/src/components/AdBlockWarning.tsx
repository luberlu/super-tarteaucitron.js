import { useEffect, useState } from "react";
import { useMeringue } from "../MeringueContext";

export default function AdBlockWarning() {
  const { meringue } = useMeringue();
  const [show, setShow] = useState(meringue.isAdBlock);
  const [orientation, setOrientation] = useState(meringue.parameters.orientation);

  useEffect(() => {
    const handlePropertyChange = (property: string, value: any) => {
        if (property === 'orientation') {
            setOrientation(value);
        }

        if (property === 'isAdBlock') {
            setShow(value);
        }
    };

    meringue.on('propertyChange', handlePropertyChange);

    return () => {
        meringue.off('propertyChange', handlePropertyChange);
    };
}, [meringue]);

  if (!show) return null;
    
  return (
    <div>
      <h1>Ad block est activé, veuillez changer vos paramètres</h1>
      <p>{meringue.lang.adblock_call}</p>
    </div>
  );
}
