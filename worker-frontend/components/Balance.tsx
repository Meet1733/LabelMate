import axios, {AxiosError} from "axios";
import { toast } from "sonner";

export async function ToastLTSBalance() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_KEY;
    await axios.get(`${BACKEND_URL}/v1/worker/me`, {
        headers: {
            Authorization: localStorage.getItem("token"),
        }
    }).then((res) => {
        const pending = res.data.amount;
        const locked = res.data.locked;
        const earning = res.data.earning;
        toast("Your Balance" , {
            description: `
                Pending Amount: ${pending},
                Locked Amount: ${locked},
                Total Earnings: ${earning}
            `,
        });
    })
    //@ts-ignore
    .catch((err) => toast.error((err as AxiosError).response?.data.message));
}