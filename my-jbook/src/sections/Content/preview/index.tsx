import { forwardRef } from 'react';
import { previewTemplate } from '../../../constants/templates/preview';

const Preview = forwardRef((props: any, previewRef: any) => {
    return (
        <>
            <iframe  
                ref={previewRef}
                srcDoc={previewTemplate}   
                sandbox="allow-scripts" 
                {...props}
            />
        </>
    );
});

export default Preview;