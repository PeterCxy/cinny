import React, { ReactNode } from 'react';
import { as, Modal, Overlay, OverlayBackdrop, OverlayCenter } from 'folds';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../utils/keyboard';
import { ModalWide } from './ViewerModal.css';

export type RenderViewerProps = {
  src: string;
  alt: string;
  requestClose: () => void;
};

export const ViewerModal = as<
  'div',
  {
    src: string;
    alt: string;
    open: boolean;
    requestClose: () => void;
    renderViewer: (props: RenderViewerProps) => ReactNode;
  }
>(({ open, requestClose, renderViewer, ...props }) => (
  <Overlay open={open} backdrop={<OverlayBackdrop />}>
    <OverlayCenter>
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          onDeactivate: requestClose,
          clickOutsideDeactivates: true,
          escapeDeactivates: stopPropagation,
        }}
      >
        <Modal className={ModalWide} size="500" onContextMenu={(evt: any) => evt.stopPropagation()}>
          {renderViewer({ ...props, requestClose })}
        </Modal>
      </FocusTrap>
    </OverlayCenter>
  </Overlay>
));
