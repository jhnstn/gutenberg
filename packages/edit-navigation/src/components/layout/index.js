/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	DropZoneProvider,
	Popover,
	SlotFillProvider,
	Spinner,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockInspector,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
} from '@wordpress/block-editor';
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EmptyState from './empty-state';
import {
	IsMenuNameControlFocusedContext,
	MenuIdContext,
	useNavigationEditor,
	useNavigationBlockEditor,
	useMenuNotifications,
} from '../../hooks';
import ErrorBoundary from '../error-boundary';
import NavigationEditorShortcuts from './shortcuts';
import Header from '../header';
import Notices from '../notices';
import Editor from '../editor';
import InspectorAdditions from '../inspector-additions';
import { store as editNavigationStore } from '../../store';

export default function Layout( { blockEditorSettings } ) {
	const canvasRef = useBlockSelectionClearer();
	const [ isMenuNameControlFocused, setIsMenuNameControlFocused ] = useState(
		false
	);
	const { saveNavigationPost } = useDispatch( editNavigationStore );
	const savePost = () => saveNavigationPost( navigationPost );

	const {
		menus,
		hasLoadedMenus,
		hasFinishedInitialLoad,
		selectedMenuId,
		navigationPost,
		selectMenu,
		deleteMenu,
	} = useNavigationEditor();

	const [ blocks, onInput, onChange ] = useNavigationBlockEditor(
		navigationPost
	);

	useMenuNotifications( selectedMenuId );

	const hasMenus = !! menus?.length;
	const isBlockEditorReady = !! ( hasMenus && navigationPost );

	return (
		<ErrorBoundary>
			<SlotFillProvider>
				<DropZoneProvider>
					<BlockEditorKeyboardShortcuts.Register />
					<NavigationEditorShortcuts.Register />

					<Notices />

					<div
						className={ classnames( 'edit-navigation-layout', {
							'has-block-inspector': isBlockEditorReady,
						} ) }
					>
						<MenuIdContext.Provider value={ selectedMenuId }>
							<IsMenuNameControlFocusedContext.Provider
								value={ useMemo(
									() => [
										isMenuNameControlFocused,
										setIsMenuNameControlFocused,
									],
									[ isMenuNameControlFocused ]
								) }
							>
								<Header
									isPending={ ! hasLoadedMenus }
									menus={ menus }
									selectedMenuId={ selectedMenuId }
									onSelectMenu={ selectMenu }
									navigationPost={ navigationPost }
								/>

								{ ! hasFinishedInitialLoad && <Spinner /> }

								{ hasFinishedInitialLoad && ! hasMenus && (
									<EmptyState />
								) }

								{ isBlockEditorReady && (
									<BlockEditorProvider
										value={ blocks }
										onInput={ onInput }
										onChange={ onChange }
										settings={ {
											...blockEditorSettings,
											templateLock: 'all',
										} }
										useSubRegistry={ false }
									>
										<BlockEditorKeyboardShortcuts />
										<NavigationEditorShortcuts
											saveBlocks={ savePost }
										/>
										<div
											className="edit-navigation-layout__canvas"
											ref={ canvasRef }
										>
											<Editor
												isPending={ ! hasLoadedMenus }
												blocks={ blocks }
											/>
										</div>
										<InspectorAdditions
											menuId={ selectedMenuId }
											onDeleteMenu={ deleteMenu }
										/>
										<BlockInspector
											bubblesVirtually={ false }
										/>
									</BlockEditorProvider>
								) }
							</IsMenuNameControlFocusedContext.Provider>
						</MenuIdContext.Provider>
					</div>

					<Popover.Slot />
				</DropZoneProvider>
			</SlotFillProvider>
		</ErrorBoundary>
	);
}
