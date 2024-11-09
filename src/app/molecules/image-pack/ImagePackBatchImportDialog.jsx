import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as zip from '@zip.js/zip.js';
import { retryNetworkOperation } from 'matrix-js-sdk';
import Spinner from '../../atoms/spinner/Spinner';
import { openReusableDialog } from '../../../client/action/navigation';
import './ImagePackBatchImportDialog.scss';
import Text from '../../atoms/text/Text';
import ImagePackItem from './ImagePackItem';
import { getFileNameExt } from '../../utils/mimeTypes';
import Button from '../../atoms/button/Button';
import RawIcon from '../../atoms/system-icons/RawIcon';
import CheckIC from '../../../../public/res/ic/outlined/check.svg';
import InfoIC from '../../../../public/res/ic/outlined/info.svg';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { scaleDownImage } from '../../../util/common';

function isValidImage(name) {
  return zip.getMimeType(getFileNameExt(name)).startsWith('image/');
}

function nameToShortcode(name) {
  return name.split('/').pop().split('.')[0];
}

function sortByShortcode(a, b) {
  if (a.shortcode === b.shortcode) {
    return 0;
  }
  if (a.shortcode < b.shortcode) {
    return -1;
  }
  return 1;
}

function ImagePackBatchImportDialog({ getFile, packName, requestClose, onImport }) {
  const mx = useMatrixClient();
  const [entries, setEntries] = useState([]);
  const [entryStateByShortcode, setEntryStateByShortcode] = useState({});
  const [uploading, setUploading] = useState(false);
  const lastUploadingRef = useRef(null);

  useEffect(() => {
    async function reload() {
      const reader = new zip.ZipReader(new zip.BlobReader(getFile()));
      const rawEntries = await reader.getEntries();
      const newEntries = await Promise.all(
        rawEntries
          .filter((entry) => isValidImage(entry.filename))
          .map(async (entry) => {
            const data = await entry.getData(new zip.BlobWriter(getFileNameExt(entry.filename)));
            return {
              shortcode: nameToShortcode(entry.filename),
              data,
              dataUri: URL.createObjectURL(data),
              entry,
            };
          })
      );
      newEntries.sort(sortByShortcode);

      setEntries(newEntries);
    }

    reload();
  }, [getFile]);

  const doUpload = useCallback(async () => {
    const failedEntries = [];
    setUploading(true);
    // eslint-disable-next-line no-restricted-syntax
    for await (const entry of entries) {
      setEntryStateByShortcode((states) => {
        const newStates = { ...states };
        newStates[entry.shortcode] = 'uploading';
        return newStates;
      });
      const image = await scaleDownImage(entry.data, 512, 512);
      try {
        await retryNetworkOperation(5, async () => {
          const { content_uri: url } = await mx.uploadContent(image);

          onImport(entry.shortcode, url);
          setEntryStateByShortcode((states) => {
            const newStates = { ...states };
            newStates[entry.shortcode] = 'uploaded';
            return newStates;
          });
        });
      } catch (e) {
        failedEntries.push(entry);
        setEntryStateByShortcode((states) => {
          const newStates = { ...states };
          newStates[entry.shortcode] = 'failed';
          return newStates;
        });
      }
    }
    setUploading(false);
    if (failedEntries.length === 0) {
      requestClose();
    } else {
      // Override entries with those that failed -- so the user can choose to try again
      setEntries(failedEntries);
    }
  }, [entries, mx, onImport, requestClose]);

  useEffect(() => {
    if (lastUploadingRef.current !== null) {
      lastUploadingRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [entryStateByShortcode]);

  return (
    <div className="image-pack-batch-import-dialog">
      {entries.length === 0 ? (
        <Spinner size="normal" />
      ) : (
        <>
          <Text variant="b1" weight="light">
            Import {entries.length} items into pack {packName}?
          </Text>
          <Button variant="primary" disabled={uploading} onClick={doUpload}>
            Import
          </Button>
          <div className="image-pack__header" style={{ marginTop: '1em' }}>
            <Text variant="b3">Image</Text>
            <Text variant="b3">Shortcode</Text>
            <Text variant="b3">Status</Text>
          </div>
          {entries.map((entry) => {
            const state = entryStateByShortcode[entry.shortcode];
            return (
              <ImagePackItem
                shortcode={entry.shortcode}
                url={entry.dataUri}
                ref={state === 'uploading' ? lastUploadingRef : null}
                renderExtraStatus={() => {
                  if (state === 'uploading') {
                    return <Spinner size="small" />;
                  }
                  if (state === 'uploaded') {
                    return <RawIcon size="small" src={CheckIC} />;
                  }
                  if (state === 'failed') {
                    return <RawIcon size="small" src={InfoIC} />;
                  }

                  return null;
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

ImagePackBatchImportDialog.defaultProps = {
  getFile: null,
  packName: null,
  requestClose: null,
  onImport: null,
};

ImagePackBatchImportDialog.propTypes = {
  getFile: PropTypes.func,
  packName: PropTypes.string,
  requestClose: PropTypes.func,
  onImport: PropTypes.func,
};

export const imagePackBatchImportDialog = (getFile, packName, onImport) => {
  openReusableDialog(
    <>
      <Text variant="s1" weight="medium">
        Batch Import -&nbsp;
      </Text>
      <Text variant="b1" weight="light">
        {getFile().name}
      </Text>
    </>,
    (requestClose) => (
      <ImagePackBatchImportDialog
        getFile={getFile}
        packName={packName}
        requestClose={requestClose}
        onImport={onImport}
      />
    )
  );
};
