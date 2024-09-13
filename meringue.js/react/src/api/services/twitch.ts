import Meringue from "..";

export default {
    key: "twitch",
    type: "video",
    name: "Twitch",
    needConsent: true,
    cookies: [],
    uri: "https://www.twitch.tv/p/en/legal/privacy-notice",
    activate: function () {

        const evt = new Event("twitch_component_enable");
        document.dispatchEvent(evt);

        Meringue
            .fallback(['twitch_player'],
                function (x: HTMLElement) {
                    const id = Meringue.getElemAttr(x, 'videoID');
                    const parent = Meringue.getElemAttr(x, 'parent');
                    const width = Meringue.getElemAttr(x, 'width');
                    const height = Meringue.getElemAttr(x, 'height');

                    var embedURL = "https://player.twitch.tv/?video=" + id + "&parent=" + parent;
                    return "<iframe width=\"" + width + "\" height=\"" + height + "\" src=\"" + embedURL + "\" scrolling=\"no\" frameborder=\"0\"></iframe>";
                });


    },
    fallback: function () {
        const evt = new Event("twitch_component_disable");
        document.dispatchEvent(evt);

        Meringue
            .fallback(["twitch_player"], Meringue.engage("twitch"));
    }
};