import { useLocalSearchParams } from 'expo-router';
import { ReaderContainer } from '@/modules/reader';

export default function ReaderRoute() {
    const { id } = useLocalSearchParams();
    const comicId = typeof id === 'string' ? id : '1';

    return <ReaderContainer comicId={comicId} />;
}
