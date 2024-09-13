import { useEffect, useState } from "react";

export default function Twitch(
    { id, width, height }: 
    { id: string, width: string, height: string}
) {

    const [enable, setEnable] = useState(false);
    const handleEnable = () => setEnable(true);
    const handleDisable = () => setEnable(true);

    useEffect(() => {
        window.addEventListener("meringue_twitch_enable", handleEnable);
        window.addEventListener("meringue_twitch_disable", handleDisable);

        return () => {
            window.removeEventListener("meringue_twitch_enable", handleEnable);
            window.removeEventListener("meringue_twitch_enable", handleDisable);
        };
    }, [])

    var embedURL = "https://player.twitch.tv/?video=" + id + "&parent=" + parent;

    return(
        <>
            {enable &&
                <iframe 
                src={ embedURL }
                width={ width } 
                height={ height}></iframe>
            }
            {!enable && 
                <div>Not enable</div>
            }
        </>
    )
}