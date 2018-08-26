import { PureComponent } from 'react';
import gtmParts from 'react-google-tag-manager';

class GoogleTagManager extends PureComponent {
    componentDidMount() {
        const dataLayerName = this.props.dataLayerName || 'dataLayer';
        const scriptId = this.props.scriptId || 'react-google-tag-manager-gtm';
        const gtmScriptNode = document.getElementById(scriptId);
        eval(gtmScriptNode.textContent);
    }

    render() {
        const { gtmId, dataLayerName, additionalEvents, type } = this.props;
        const gtm = gtmParts({
            id: gtmId,
            dataLayerName: dataLayerName || 'dataLayer',
            additionalEvents: additionalEvents || {}
        });

        if(type == "noscript"){
            return gtm.noScriptAsReact();
        }else{
            return gtm.scriptAsReact();
        }
    }
}

export default GoogleTagManager;
