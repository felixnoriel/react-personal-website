import * as React from 'react';
// @ts-ignore
import gtmParts from 'react-google-tag-manager';

type Props = {
    gtmId: string;
    dataLayerName?: string;
    additionalEvents?: string;
    type: string;
    scriptId: string;
};
export const GoogleTagManager: React.SFC<Props> = ({ gtmId, dataLayerName, additionalEvents, type, scriptId }) => {
    React.useEffect(() => {
        const gtmScriptNode = document.getElementById(scriptId || 'react-google-tag-manager-gtm');
        eval!(gtmScriptNode!.textContent!);
    }, []);

    const gtm = gtmParts({
        id: gtmId,
        dataLayerName: dataLayerName || 'dataLayer',
        additionalEvents: additionalEvents || {},
    });

    const gtmScript = () => {
        if (type === 'noscript') {
            return gtm.noScriptAsReact();
        } else {
            return gtm.scriptAsReact();
        }
    };
    return <div>{gtmScript()}</div>;
};
