/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlobByURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import {
	__unstableGetAnimateClassName as getAnimateClassName,
	withNotices,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockControls,
	BlockIcon,
	MediaPlaceholder,
	MediaReplaceFlow,
	RichText,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';
import { file as icon } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import FileBlockInspector from './inspector';

function ClipboardToolbarButton( { text, disabled } ) {
	const { createNotice } = useDispatch( noticesStore );
	const ref = useCopyToClipboard( text, () => {
		createNotice( 'info', __( 'Copied URL to clipboard.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	} );

	return (
		<ToolbarButton
			className="components-clipboard-toolbar-button"
			ref={ ref }
			disabled={ disabled }
		>
			{ __( 'Copy URL' ) }
		</ToolbarButton>
	);
}

function FileEdit( { attributes, setAttributes, noticeUI, noticeOperations } ) {
	const {
		id,
		fileName,
		href,
		textLinkHref,
		textLinkTarget,
		showDownloadButton,
		downloadButtonText,
	} = attributes;
	const [ hasError, setHasError ] = useState( false );
	const { media, mediaUpload } = useSelect(
		( select ) => ( {
			media:
				id === undefined
					? undefined
					: select( coreStore ).getMedia( id ),
			mediaUpload: select( blockEditorStore ).getSettings().mediaUpload,
		} ),
		[ id ]
	);

	useEffect( () => {
		// Upload a file drag-and-dropped into the editor
		if ( isBlobURL( href ) ) {
			const file = getBlobByURL( href );

			mediaUpload( {
				filesList: [ file ],
				onFileChange: ( [ newMedia ] ) => onSelectFile( newMedia ),
				onError: ( message ) => {
					setHasError( true );
					noticeOperations.createErrorNotice( message );
				},
			} );

			revokeBlobURL( href );
		}

		if ( downloadButtonText === undefined ) {
			changeDownloadButtonText( _x( 'Download', 'button label' ) );
		}
	}, [] );

	function onSelectFile( newMedia ) {
		if ( newMedia && newMedia.url ) {
			setHasError( false );
			setAttributes( {
				href: newMedia.url,
				fileName: newMedia.title,
				textLinkHref: newMedia.url,
				id: newMedia.id,
			} );
		}
	}

	function onUploadError( message ) {
		setHasError( true );
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	}

	function changeLinkDestinationOption( newHref ) {
		// Choose Media File or Attachment Page (when file is in Media Library)
		setAttributes( { textLinkHref: newHref } );
	}

	function changeOpenInNewWindow( newValue ) {
		setAttributes( {
			textLinkTarget: newValue ? '_blank' : false,
		} );
	}

	function changeShowDownloadButton( newValue ) {
		setAttributes( { showDownloadButton: newValue } );
	}

	function changeDownloadButtonText( newValue ) {
		// Remove anchor tags from button text content.
		setAttributes( {
			downloadButtonText: newValue.replace( /<\/?a[^>]*>/g, '' ),
		} );
	}

	const attachmentPage = media && media.link;

	const blockProps = useBlockProps( {
		className: classnames(
			isBlobURL( href ) && getAnimateClassName( { type: 'loading' } ),
			{
				'is-transient': isBlobURL( href ),
			}
		),
	} );

	if ( ! href || hasError ) {
		return (
			<div { ...blockProps }>
				<MediaPlaceholder
					icon={ <BlockIcon icon={ icon } /> }
					labels={ {
						title: __( 'File' ),
						instructions: __(
							'Upload a file or pick one from your media library.'
						),
					} }
					onSelect={ onSelectFile }
					notices={ noticeUI }
					onError={ onUploadError }
					accept="*"
				/>
			</div>
		);
	}

	return (
		<>
			<FileBlockInspector
				hrefs={ { href, textLinkHref, attachmentPage } }
				{ ...{
					openInNewWindow: !! textLinkTarget,
					showDownloadButton,
					changeLinkDestinationOption,
					changeOpenInNewWindow,
					changeShowDownloadButton,
				} }
			/>
			<BlockControls>
				<ToolbarGroup>
					<MediaReplaceFlow
						mediaId={ id }
						mediaURL={ href }
						accept="*"
						onSelect={ onSelectFile }
						onError={ onUploadError }
					/>
					<ClipboardToolbarButton
						text={ href }
						disabled={ isBlobURL( href ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			<div { ...blockProps }>
				<div className={ 'wp-block-file__content-wrapper' }>
					<div className="wp-block-file__textlink">
						<RichText
							tagName="div" // must be block-level or else cursor disappears
							value={ fileName }
							placeholder={ __( 'Write file name…' ) }
							withoutInteractiveFormatting
							onChange={ ( text ) =>
								setAttributes( { fileName: text } )
							}
						/>
					</div>
					{ showDownloadButton && (
						<div
							className={
								'wp-block-file__button-richtext-wrapper'
							}
						>
							{ /* Using RichText here instead of PlainText so that it can be styled like a button */ }
							<RichText
								tagName="div" // must be block-level or else cursor disappears
								aria-label={ __( 'Download button text' ) }
								className={ 'wp-block-file__button' }
								value={ downloadButtonText }
								withoutInteractiveFormatting
								placeholder={ __( 'Add text…' ) }
								onChange={ ( text ) =>
									changeDownloadButtonText( text )
								}
							/>
						</div>
					) }
				</div>
			</div>
		</>
	);
}

export default withNotices( FileEdit );
