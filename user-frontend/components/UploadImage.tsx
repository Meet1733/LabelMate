"use client"
import { useState } from "react"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/util/config";

export function UploadImage({onImageAdded , image}: {
    onImageAdded: (image: string) => void;
    image?: string;
}) {
    const [uploading , setUploading] = useState(false);
    const [uploadProgress , setUploadProgress] = useState(0);
    const [downloadURL , setDownloadURL] = useState("");

    async function onFileSelect(e: any){
        setUploading(true);
        try{
            const file = e.target.files[0];
            if(file){
                const fileRef = ref(storage ,  `files/${file.name}`);
                const uploadTask = uploadBytesResumable(fileRef , file);

                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadProgress(progress);
                    },(error) => {
                        console.error("Error uploading file" , error);
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                            setDownloadURL(downloadURL);
                            onImageAdded(downloadURL);
                        })
                    }
                )
            }
            
        }catch(e){
            console.log(e);  
        }
        setUploading(false);
    }

    if(image){
        return <img className={"p-2 w-96 rounded"} src={image}/>
    }

    return <div>
        <div className="w-40 h-40 rounded border text-2xl cursor-pointer">
            <div className="h-full flex justify-center flex-col relative w-full">
                <div className="h-full flex justify-center w-full pt-16 text-4xl">
                    {uploading ? <div className="text-sm">Loading....</div> : <>
                        +
                         <input type="file" className="opacity-0 absolute top-0 left-0 bottom-0 right-0 w-full h-full" onChange={onFileSelect}/>
                    </>}
                </div>
            </div>
        </div>
    </div>
}