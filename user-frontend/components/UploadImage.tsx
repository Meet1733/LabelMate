"use client"
import { useEffect, useState } from "react"
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
                        });
                        setUploading(false);
                        setUploadProgress(0);
                    }
                )
            }
            
        }catch(e){
            console.log(e);  
            setUploading(false);
        }
        
    }

    if(image){
        return <img className={"p-2 rounded w-[20rem] h-[15rem]"} src={image}/>
    }

    return <div>
        <div className="w-40 h-40 rounded border text-2xl cursor-pointer">
            <div className="h-full flex justify-center flex-col relative w-full">
                <div className="h-full flex justify-center w-full items-center text-4xl">
                    {uploading ? ( <div>
                            <div className="text-2xl cursor-not-allowed">Uploading</div> 
                            <div className="text-2xl cursor-not-allowed text-center">{(uploadProgress).toFixed(1)}%</div>
                        </div>) : <>
                        +
                         <input type="file" className="opacity-0 absolute top-0 left-0 bottom-0 right-0 w-full h-full cursor-pointer" onChange={onFileSelect}/>
                    </>}
                </div>
            </div>
        </div>
    </div>
}